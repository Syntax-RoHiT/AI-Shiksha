import { Controller, Get, Put, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../enums/role.enum';
import { UpdateAiSettingsDto } from './dto/update-ai-settings.dto';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN, Role.FRANCHISE_ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @Get('stats')
  getStats(@Request() req) {
    const isSuperAdmin = req.user?.role === Role.SUPER_ADMIN;
    const franchiseId = isSuperAdmin ? undefined : (req.user?.franchise_id || undefined);
    return this.adminService.getPlatformStats(franchiseId);
  }

  @Get('analytics/user-growth')
  getUserGrowth(@Request() req) {
    const isSuperAdmin = req.user?.role === Role.SUPER_ADMIN;
    const franchiseId = isSuperAdmin ? undefined : (req.user?.franchise_id || undefined);
    return this.adminService.getUserGrowth(franchiseId);
  }

  @Get('analytics/revenue')
  getRevenue(@Request() req) {
    const isSuperAdmin = req.user?.role === Role.SUPER_ADMIN;
    const franchiseId = isSuperAdmin ? undefined : (req.user?.franchise_id || undefined);
    return this.adminService.getRevenueData(franchiseId);
  }

  @Get('pending-actions')
  getPendingActions(@Request() req) {
    const isSuperAdmin = req.user?.role === Role.SUPER_ADMIN;
    const franchiseId = isSuperAdmin ? undefined : (req.user?.franchise_id || undefined);
    return this.adminService.getPendingActions(franchiseId);
  }

  @Get('ai-settings')
  async getAiSettings(@Request() req) {
    const isSuperAdmin = req.user?.role === Role.SUPER_ADMIN;
    let franchiseId = isSuperAdmin ? undefined : (req.user?.franchise_id || undefined);

    // Fallback to tenantId from middleware if no explicit franchise is set on user
    franchiseId = franchiseId || req.tenantId || req.tenantBranding?.id;

    if (!franchiseId) {
      const defaultFranchise = await this.adminService.getFirstFranchise();
      if (defaultFranchise) {
        franchiseId = defaultFranchise.id;
      }
    }

    return this.adminService.getAiSettings(franchiseId);
  }

  @Put('ai-settings')
  async updateAiSettings(@Request() req, @Body() updateAiSettingsDto: UpdateAiSettingsDto) {
    const isSuperAdmin = req.user?.role === Role.SUPER_ADMIN;
    let franchiseId = isSuperAdmin ? undefined : (req.user?.franchise_id || undefined);

    franchiseId = franchiseId || req.tenantId || req.tenantBranding?.id;

    if (!franchiseId) {
      // Fallback to the first franchise (usually the master franchise) for local/super admin context
      const defaultFranchise = await this.adminService.getFirstFranchise();
      if (defaultFranchise) {
          franchiseId = defaultFranchise.id;
      } else {
          throw new BadRequestException('Cannot update AI settings without a franchise context.');
      }
    }

    return this.adminService.updateAiSettings(
      franchiseId,
      updateAiSettingsDto.gemini_api_key,
      updateAiSettingsDto.global_ai_control
    );
  }
}


