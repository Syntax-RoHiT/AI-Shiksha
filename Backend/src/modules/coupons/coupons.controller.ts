import { Controller, Get, Post, Body, Put, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../enums/role.enum';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.FRANCHISE_ADMIN, Role.SUPER_ADMIN, Role.ADMIN)
  @Post()
  create(@Req() req, @Body() createCouponDto: any) {
    return this.couponsService.create(req.user.franchise_id, createCouponDto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.FRANCHISE_ADMIN, Role.SUPER_ADMIN, Role.ADMIN)
  @Get()
  findAll(@Req() req) {
    return this.couponsService.findAll(req.user.franchise_id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.FRANCHISE_ADMIN, Role.SUPER_ADMIN, Role.ADMIN)
  @Get(':id')
  findOne(@Req() req, @Param('id') id: string) {
    return this.couponsService.findOne(req.user.franchise_id, id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.FRANCHISE_ADMIN, Role.SUPER_ADMIN, Role.ADMIN)
  @Put(':id')
  update(@Req() req, @Param('id') id: string, @Body() updateCouponDto: any) {
    return this.couponsService.update(req.user.franchise_id, id, updateCouponDto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.FRANCHISE_ADMIN, Role.SUPER_ADMIN, Role.ADMIN)
  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    return this.couponsService.remove(req.user.franchise_id, id);
  }

  // Public endpoint for students to validate coupons during checkout
  @UseGuards(AuthGuard('jwt'))
  @Post('validate')
  validateCoupon(@Req() req, @Body() body: { code: string, courseId: string }) {
    return this.couponsService.validate(req.user.franchise_id, body.code, body.courseId, req.user.id);
  }
}
