import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  async create(franchiseId: string, data: any) {
    const existing = await this.prisma.coupon.findUnique({
      where: {
        code_franchise_id: { code: data.code, franchise_id: franchiseId },
      },
    });

    if (existing) {
      throw new ConflictException('A coupon with this code already exists for your franchise');
    }

    return this.prisma.coupon.create({
      data: {
        ...data,
        franchise_id: franchiseId,
      },
    });
  }

  async findAll(franchiseId: string) {
    return this.prisma.coupon.findMany({
      where: { franchise_id: franchiseId },
      orderBy: { created_at: 'desc' },
      include: {
        course: { select: { id: true, title: true } }
      }
    });
  }

  async findOne(franchiseId: string, id: string) {
    const coupon = await this.prisma.coupon.findFirst({
      where: { id, franchise_id: franchiseId },
    });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return coupon;
  }

  async update(franchiseId: string, id: string, data: any) {
    const coupon = await this.findOne(franchiseId, id);
    return this.prisma.coupon.update({
      where: { id: coupon.id },
      data,
    });
  }

  async remove(franchiseId: string, id: string) {
    const coupon = await this.findOne(franchiseId, id);
    return this.prisma.coupon.delete({
      where: { id: coupon.id },
    });
  }

  async validate(franchiseId: string, code: string, courseId: string, userId: string) {
    const coupon = await this.prisma.coupon.findFirst({
      where: { code, franchise_id: franchiseId, is_active: true }
    });

    if (!coupon) throw new NotFoundException('Invalid or expired coupon');

    const now = new Date();
    if (coupon.start_date && now < coupon.start_date) {
      throw new BadRequestException('Coupon is not yet valid');
    }
    if (coupon.end_date && now > coupon.end_date) {
      throw new BadRequestException('Coupon has expired');
    }

    if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) {
      throw new BadRequestException('Coupon usage limit reached');
    }

    if (coupon.course_id && coupon.course_id !== courseId) {
      throw new BadRequestException('This coupon is not applicable for this course');
    }

    // Optionally check if user has already used it (from Payment model)
    const previousUsage = await this.prisma.payment.count({
      where: { coupon_id: coupon.id, user_id: userId, payment_status: 'success' }
    });

    if (previousUsage > 0) {
       throw new BadRequestException('You have already used this coupon');
    }

    // Now calculate discount on course price
    const course = await this.prisma.course.findFirst({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    const originalPrice = course.price;
    if (coupon.min_order_value && originalPrice < coupon.min_order_value) {
      throw new BadRequestException(`Minimum cart value of ${coupon.min_order_value} required`);
    }

    let discountAmount = 0;
    if (coupon.discount_type === 'PERCENTAGE') {
      discountAmount = (originalPrice * coupon.discount_value) / 100;
      if (coupon.max_discount && discountAmount > coupon.max_discount) {
        discountAmount = coupon.max_discount;
      }
    } else {
      // FIXED_AMOUNT
      discountAmount = coupon.discount_value;
    }

    const finalPrice = Math.max(0, originalPrice - discountAmount);

    return {
      valid: true,
      original_price: originalPrice,
      discount_amount: discountAmount,
      final_price: finalPrice,
      coupon_id: coupon.id
    };
  }
}
