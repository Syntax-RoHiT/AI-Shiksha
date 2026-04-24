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
    const franchiseId = req.user.franchise_id || (req as any).tenantId;
    return this.razorpayService.getSettings(franchiseId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.FRANCHISE_ADMIN)
  @Put('settings')
  async updateSettings(@Req() req, @Body() data: any) {
    const franchiseId = req.user.franchise_id || (req as any).tenantId;
    return this.razorpayService.updateSettings(franchiseId, data);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('create-order')
  async createOrder(
    @Req() req,
    @Body() data: { courseIds: string[]; amount: number; couponId?: string },
  ) {
    // req.user.userId comes from JWT strategy (maps to payload.sub)
    const userId = req.user.userId;
    const franchiseId = req.user.franchise_id || (req as any).tenantId;
    return this.razorpayService.createOrder(franchiseId, userId, data);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('verify')
  async verifyPayment(
    @Req() req,
    @Body() data: { paymentId: string; orderId: string; signature: string },
  ) {
    const franchiseId = req.user.franchise_id || (req as any).tenantId;
    return this.razorpayService.verifyPayment(franchiseId, data);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.FRANCHISE_ADMIN)
  @Get('transactions')
  async getTransactions(@Req() req) {
    const franchiseId = req.user.franchise_id || (req as any).tenantId;
    return this.razorpayService.getTransactions(franchiseId);
  }
}
