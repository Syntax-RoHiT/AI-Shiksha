import { Controller, Get, Put, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RazorpayService } from './razorpay.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../enums/role.enum';

@Controller('payments/razorpay')
export class RazorpayController {
  constructor(private readonly razorpayService: RazorpayService) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.FRANCHISE_ADMIN)
  @Get('settings')
  async getSettings(@Req() req) {
    return this.razorpayService.getSettings(req.user.franchise_id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.FRANCHISE_ADMIN)
  @Put('settings')
  async updateSettings(@Req() req, @Body() data: any) {
    return this.razorpayService.updateSettings(req.user.franchise_id, data);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('create-order')
  async createOrder(@Req() req, @Body() data: { courseId: string; amount: number; couponId?: string }) {
    return this.razorpayService.createOrder(req.user.franchise_id, req.user.id, data);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('verify')
  async verifyPayment(@Req() req, @Body() data: { paymentId: string; orderId: string; signature: string }) {
    return this.razorpayService.verifyPayment(req.user.franchise_id, data);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.FRANCHISE_ADMIN)
  @Get('transactions')
  async getTransactions(@Req() req) {
    return this.razorpayService.getTransactions(req.user.franchise_id);
  }
}
