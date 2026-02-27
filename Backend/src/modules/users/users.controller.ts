import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Query,
  Delete,
  Param,
  BadRequestException,
  NotFoundException,
  Patch,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../enums/role.enum';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CreateUserDto, BulkCreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto, ChangePasswordDto } from './dto/update-profile.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    console.log("UPDATE_PROFILE_REQUEST", { body: updateProfileDto });
    return this.usersService.updateProfile(req.user.userId, updateProfileDto);
  }

  @Delete('profile/avatar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user avatar' })
  deleteAvatar(@Request() req) {
    return this.usersService.deleteAvatar(req.user.userId);
  }

  @Post('change-password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user password' })
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    try {
      return await this.usersService.changePassword(req.user.userId, changePasswordDto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('dashboard/stats')
  @Roles(Role.STUDENT, Role.ADMIN) // Allow admin to see too? Or just student.
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get student dashboard stats' })
  getDashboardStats(@Request() req) {
    return this.usersService.getStudentDashboardStats(req.user.userId);
  }

  @Get('leaderboard')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get student leaderboard' })
  getLeaderboard(@Request() req) {
    return this.usersService.getLeaderboard(req.user.franchise_id);
  }

  @Get('stats/students')
  @Roles(Role.ADMIN, Role.FRANCHISE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get student statistics (Admin only)' })
  getStudentStats(@Request() req) {
    const isSuperAdmin = req.user?.role === Role.SUPER_ADMIN;
    const franchiseId = isSuperAdmin ? undefined : (req.user?.franchise_id || undefined);
    return this.usersService.getStudentStats(franchiseId);
  }

  @Get('stats/teachers')
  @Roles(Role.ADMIN, Role.FRANCHISE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get teacher statistics (Admin only)' })
  getTeacherStats(@Request() req) {
    const isSuperAdmin = req.user?.role === Role.SUPER_ADMIN;
    const franchiseId = isSuperAdmin ? undefined : (req.user?.franchise_id || undefined);
    return this.usersService.getTeacherStats(franchiseId);
  }

  @Get()
  @Roles(Role.ADMIN, Role.FRANCHISE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all users (Admin only)' })
  findAll(@Query('role') role: Role, @Request() req) {
    const isSuperAdmin = req.user?.role === Role.SUPER_ADMIN;
    // IF SUPER_ADMIN, and franchise_id query param is passed, filter by it.
    // IF NOT SUPER_ADMIN, enforce req.user.franchise_id.
    let targetFranchiseId = isSuperAdmin ? undefined : (req.user?.franchise_id || null);

    // Allow Super Admin to filter by franchise if query param provided (future proofing)
    // For now, let's keep it simple: Super Admin sees all, Franchise Admin sees theirs.

    return this.usersService.findAll(role, targetFranchiseId, isSuperAdmin);
  }

  @Post()
  @Roles(Role.ADMIN, Role.FRANCHISE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  create(@Body() createUserDto: CreateUserDto, @Request() req) {
    const isSuperAdmin = req.user?.role === Role.SUPER_ADMIN;
    const franchiseId = isSuperAdmin ? null : (req.user?.franchise_id || null);
    const domain = req.headers.origin || req.headers.host || 'https://experttrainersacademy.cloud';
    // Ensure we construct a proper URL
    const loginUrl = domain.startsWith('http') ? `${domain}/login` : `https://${domain}/login`;
    return this.usersService.create(createUserDto, franchiseId, true, loginUrl);
  }

  @Post('bulk')
  @Roles(Role.ADMIN, Role.FRANCHISE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create multiple users in bulk (Admin only)' })
  createBulk(@Body() bulkCreateUserDto: BulkCreateUserDto, @Request() req) {
    const isSuperAdmin = req.user?.role === Role.SUPER_ADMIN;
    const franchiseId = isSuperAdmin ? null : (req.user?.franchise_id || null);
    const domain = req.headers.origin || req.headers.host || 'https://experttrainersacademy.cloud';
    // Ensure we construct a proper URL
    const loginUrl = domain.startsWith('http') ? `${domain}/login` : `https://${domain}/login`;
    return this.usersService.createBulk(bulkCreateUserDto, franchiseId, loginUrl);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.FRANCHISE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a user (Admin only)' })
  async delete(@Param('id') id: string, @Request() req) {
    // Prevent self-deletion
    if (id === req.user.userId) {
      throw new BadRequestException('Cannot delete your own account');
    }
    const isSuperAdmin = req.user?.role === Role.SUPER_ADMIN;
    const franchiseId = isSuperAdmin ? undefined : (req.user?.franchise_id || undefined);
    return this.usersService.delete(id, franchiseId);
  }

  @Patch(':id/role')
  @Roles(Role.ADMIN, Role.FRANCHISE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a user role (Admin only)' })
  async updateRole(
    @Param('id') id: string,
    @Body('role') newRole: string,
    @Request() req,
  ) {
    if (id === req.user.userId) {
      throw new BadRequestException('Cannot change your own role this way');
    }
    const isSuperAdmin = req.user?.role === Role.SUPER_ADMIN;
    const franchiseId = isSuperAdmin ? undefined : (req.user?.franchise_id || undefined);
    return this.usersService.updateRole(id, newRole, franchiseId);
  }
}

