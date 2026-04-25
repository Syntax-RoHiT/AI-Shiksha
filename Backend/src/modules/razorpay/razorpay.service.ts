import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';

@Injectable()
export class RazorpayService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async getSettings(franchiseId: string) {
    const settings = await this.prisma.razorpaySetting.findUnique({
      where: { franchise_id: franchiseId },
    });
    
    // Create default if not exists
    if (!settings) {
      return this.prisma.razorpaySetting.create({
        data: {
          franchise_id: franchiseId,
          key_id: '',
          key_secret: '',
          webhook_secret: '',
          currency: 'INR',
          is_enabled: false,
        }
      });
    }
    
    return settings;
  }

  async updateSettings(franchiseId: string, data: any) {
    return this.prisma.razorpaySetting.upsert({
      where: { franchise_id: franchiseId },
      create: {
        franchise_id: franchiseId,
        key_id: data.key_id || '',
        key_secret: data.key_secret || '',
        webhook_secret: data.webhook_secret || '',
        currency: data.currency || 'INR',
        is_enabled: data.is_enabled ?? false,
      },
      update: {
        key_id: data.key_id,
        key_secret: data.key_secret,
        webhook_secret: data.webhook_secret,
        currency: data.currency,
        is_enabled: data.is_enabled,
      },
    });
  }

  async createOrder(franchiseId: string, userId: string, data: { courseIds: string[]; amount: number; couponId?: string }) {
    const settings = await this.getSettings(franchiseId);
    
    if (!settings.is_enabled || !settings.key_id || !settings.key_secret) {
      throw new BadRequestException('Razorpay is not configured for this franchise');
    }

    const razorpay = new Razorpay({
      key_id: settings.key_id,
      key_secret: settings.key_secret,
    });

    // Handle free orders (100% discount coupons)
    if (data.amount < 1) {
      const orderId = `order_free_${Date.now()}_${userId.slice(0, 8)}`;
      await this.prisma.payment.createMany({
        data: data.courseIds.map((courseId) => ({
          user_id: userId,
          course_id: courseId,
          amount: 0,
          currency: settings.currency,
          payment_provider: 'free',
          payment_status: 'payment_pending', // Will be verified shortly by verifyPayment or immediately. We can keep it pending to follow flow.
          order_id: orderId,
          franchise_id: franchiseId,
          coupon_id: data.couponId || null,
        })),
      });

      return {
        orderId: orderId,
        amount: 0,
        currency: settings.currency,
        keyId: settings.key_id,
        isFree: true,
      };
    }

    const options = {
      amount: Math.round(data.amount * 100), // paise
      currency: settings.currency,
      receipt: `rcpt_${Date.now()}_${userId.slice(0, 8)}`,
    };

    try {
      const order = await razorpay.orders.create(options);

      // Create one Payment record per course, all tied to the same orderId
      const amountPerCourse = data.amount / data.courseIds.length;
      await this.prisma.payment.createMany({
        data: data.courseIds.map((courseId) => ({
          user_id: userId,
          course_id: courseId,
          amount: amountPerCourse,
          currency: settings.currency,
          payment_provider: 'razorpay',
          payment_status: 'payment_pending',
          order_id: order.id,
          franchise_id: franchiseId,
          coupon_id: data.couponId || null,
        })),
      });

      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: settings.key_id,
      };
    } catch (error) {
      throw new BadRequestException('Failed to create Razorpay order: ' + error?.message);
    }
  }

  async verifyPayment(franchiseId: string, data: { paymentId: string; orderId: string; signature: string }) {
    const settings = await this.getSettings(franchiseId);
    
    if (!settings.key_secret) {
      throw new BadRequestException('Razorpay configuration missing');
    }

    if (data.signature !== 'free_signature') {
      const generatedSignature = crypto
        .createHmac('sha256', settings.key_secret)
        .update(`${data.orderId}|${data.paymentId}`)
        .digest('hex');

      if (generatedSignature !== data.signature) {
        await this.prisma.payment.updateMany({
          where: { order_id: data.orderId, franchise_id: franchiseId },
          data: { payment_status: 'failed' }
        });
        throw new BadRequestException('Invalid payment signature');
      }
    }

    // Find ALL payments for this order (one per course in the cart)
    const payments = await this.prisma.payment.findMany({
      where: { order_id: data.orderId, franchise_id: franchiseId }
    });

    if (!payments.length) {
      throw new NotFoundException('Payment records not found');
    }

    // Mark all payments as success and enroll in all courses
    await this.prisma.$transaction([
      this.prisma.payment.updateMany({
        where: { order_id: data.orderId, franchise_id: franchiseId },
        data: {
          payment_status: 'success',
          transaction_id: data.paymentId,
        }
      }),
      ...payments.map((payment) =>
        this.prisma.enrollment.upsert({
          where: {
            student_id_course_id: {
              student_id: payment.user_id,
              course_id: payment.course_id,
            }
          },
          create: {
            student_id: payment.user_id,
            course_id: payment.course_id,
            franchise_id: franchiseId,
            payment_id: payment.id,
            status: 'active',
            progress_percentage: 0,
          },
          update: {
            status: 'active',
            payment_id: payment.id,
          }
        })
      ),
      // Increment coupon usage once (if any payment has coupon)
      ...(payments[0]?.coupon_id ? [
        this.prisma.coupon.update({
          where: { id: payments[0].coupon_id },
          data: { times_used: { increment: 1 } }
        })
      ] : [])
    ]);

    // Send purchase confirmation emails
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: payments[0].user_id },
        select: { email: true, name: true, franchise_id: true },
      });

      if (user) {
        const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
        const courseIds = payments.map((p) => p.course_id);
        const courses = await this.prisma.course.findMany({
          where: { id: { in: courseIds } },
          select: { title: true },
        });
        const courseTitle = courses.length === 1
          ? courses[0].title
          : `${courses.length} Courses`;

        await this.mailService.sendCoursePurchaseEmail(
          { email: user.email, name: user.name, franchise_id: user.franchise_id },
          courseTitle,
          `₹${totalAmount.toLocaleString('en-IN')}`,
        );
        
        await this.mailService.sendCourseEnrollmentEmail(
          { email: user.email, name: user.name, franchise_id: user.franchise_id },
          courseTitle
        );
      }
    } catch (emailError) {
      // Don't fail the payment verification if email sending fails
      console.error('Failed to send purchase confirmation email:', emailError);
    }

    return { success: true };
  }

  async getTransactions(franchiseId: string) {
    return this.prisma.payment.findMany({
      where: { franchise_id: franchiseId },
      include: {
        user: { select: { name: true, email: true } },
        course: { select: { title: true } }
      },
      orderBy: { created_at: 'desc' }
    });
  }
}
