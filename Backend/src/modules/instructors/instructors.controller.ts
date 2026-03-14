import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InstructorsService } from './instructors.service';
import { CreateInstructorDto } from './dto/create-instructor.dto';
import { UpdateInstructorDto } from './dto/update-instructor.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport'; // Or use generic guard
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../../enums/role.enum';

@ApiTags('Instructors')
@Controller('instructors')
export class InstructorsController {
  constructor(private readonly instructorsService: InstructorsService) { }

  @Get('admin/list')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.FRANCHISE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all instructors with stats (Admin)' })
  getAdminList(@Request() req) {
    const isSuperAdmin = req.user?.role === Role.SUPER_ADMIN || req.user?.role === 'SUPER_ADMIN';
    const franchiseId = isSuperAdmin ? undefined : (req.user?.franchise_id ?? null);
    return this.instructorsService.findAllWithStats(franchiseId);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Become an instructor (create profile)' })
  create(@Request() req, @Body() createInstructorDto: CreateInstructorDto) {
    return this.instructorsService.create(req.user.userId, createInstructorDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all instructors' })
  findAll() {
    return this.instructorsService.findAll();
  }

  @Get('dashboard/stats')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get instructor dashboard stats' })
  getDashboardStats(@Request() req) {
    return this.instructorsService.getDashboardStats(req.user.userId);
  }

  @Get('dashboard/students')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get instructor dashboard students list' })
  getStudents(@Request() req) {
    return this.instructorsService.getStudents(req.user.userId);
  }

  @Get('dashboard/reviews')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get instructor dashboard course reviews' })
  getReviews(@Request() req) {
    return this.instructorsService.getReviews(req.user.userId);
  }

  @Get('dashboard/qa')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get instructor dashboard course Q/A' })
  getQA(@Request() req) {
    return this.instructorsService.getQA(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get instructor details' })
  findOne(@Param('id') id: string) {
    return this.instructorsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update instructor profile' })
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateInstructorDto: UpdateInstructorDto,
  ) {
    return this.instructorsService.update(id, updateInstructorDto, req.user.userId);
  }
}
