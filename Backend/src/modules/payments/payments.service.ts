import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { MailService } from '../mail/mail.service';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY') || '',
      {
        apiVersion: '2024-12-18.acacia' as any, // Use latest or let types decide
      },
    );
  }

  async createCheckoutSession(userId: string, courseId: string, franchiseId?: string | null) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { instructor: { include: { user: true } } },
    });

    if (!course) throw new BadRequestException('Course not found');

    // Verify course belongs to franchise
    if (franchiseId && course.franchise_id && course.franchise_id !== franchiseId) {
      throw new ForbiddenException('Cannot purchase course from another franchise');
    }

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: course.title,
              images: course.thumbnail_url ? [course.thumbnail_url] : [],
            },
            unit_amount: Math.round(course.price * 100), // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${this.configService.get('FRONTEND_URL')}/courses/${courseId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.configService.get('FRONTEND_URL')}/courses/${courseId}`,
      client_reference_id: userId,
      metadata: {
        courseId: courseId,
        userId: userId,
        franchiseId: franchiseId || '',
      },
    });

    return { sessionId: session.id, url: session.url };
  }

  async handleWebhook(signature: string, payload: Buffer) {
    const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
    } catch (err) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      await this.fulfillOrder(session);
    }
  }

  private async fulfillOrder(session: Stripe.Checkout.Session) {
    if (
      !session.metadata ||
      !session.metadata.userId ||
      !session.metadata.courseId
    ) {
      console.error('Missing metadata in session', session.id);
      return;
    }
    const userId = session.metadata.userId;
    const courseId = session.metadata.courseId;
    const franchiseId = session.metadata.franchiseId || null;

    // Check if already enrolled
    const existing = await this.prisma.enrollment.findUnique({
      where: {
        student_id_course_id: {
          student_id: userId,
          course_id: courseId,
        },
      },
    });

    if (existing) return;

    // Fetch Course to ensure we have the correct franchise context
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    // Use course's franchise_id if available, otherwise fallback to session metadata (user's franchise)
    const targetFranchiseId = (course && course.franchise_id) ? course.franchise_id : franchiseId;

    // Create Payment Record
    const amountStr = session.amount_total ? `${session.currency?.toUpperCase() || 'USD'} ${(session.amount_total / 100).toFixed(2)}` : 'Free';

    await this.prisma.payment.create({
      data: {
        user_id: userId,
        course_id: courseId,
        amount: (session.amount_total || 0) / 100,
        payment_provider: 'stripe',
        payment_status: 'completed',
        transaction_id: session.id,
        franchise_id: targetFranchiseId,
      },
    });

    // Enroll User
    await this.prisma.enrollment.create({
      data: {
        student_id: userId,
        course_id: courseId,
        status: 'active',
        franchise_id: targetFranchiseId,
        expires_at: (course?.access_days_limit) ? (() => {
          const d = new Date();
          d.setDate(d.getDate() + course.access_days_limit);
          return d;
        })() : null,
        total_learning_time: 0,
      },
    });

    if (user && course) {
      this.mailService.sendCoursePurchaseEmail({
        email: user.email,
        name: user.name,
        franchise_id: targetFranchiseId,
      }, course.title, amountStr);

      this.mailService.sendCourseEnrollmentEmail({
        email: user.email,
        name: user.name,
        franchise_id: targetFranchiseId,
      }, course.title);
    }
  }
}
