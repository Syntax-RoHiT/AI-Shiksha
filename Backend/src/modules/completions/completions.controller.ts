import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { CompletionsService } from './completions.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../enums/role.enum';

@ApiTags('completions')
@Controller('completions')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class CompletionsController {
    constructor(private readonly completionsService: CompletionsService) { }

    @Get()
    @Roles(Role.ADMIN, Role.FRANCHISE_ADMIN)
    @ApiOperation({ summary: 'Get all course completions (Admin only)' })
    @ApiQuery({ name: 'search', required: false, type: String })
    async findAll(@Request() req, @Query('search') search?: string) {
        return this.completionsService.findAll(search, req.user.franchise_id);
    }

    @Get('stats')
    @Roles(Role.ADMIN, Role.FRANCHISE_ADMIN)
    @ApiOperation({ summary: 'Get completion statistics (Admin only)' })
    async getStats(@Request() req) {
        return this.completionsService.getStats(req.user.franchise_id);
    }

    @Post('manual')
    @Roles(Role.ADMIN, Role.FRANCHISE_ADMIN)
    @ApiOperation({ summary: 'Manually mark course as complete and auto-issue certificate (Admin only)' })
    async markComplete(
        @Body('student_id') studentId: string,
        @Body('course_id') courseId: string,
        @Request() req: any,
    ) {
        return this.completionsService.markComplete(studentId, courseId, req.user.userId);
    }

    @Post('issue-certificate')
    @Roles(Role.ADMIN, Role.FRANCHISE_ADMIN)
    @ApiOperation({ summary: 'Issue certificate for completed course (Admin only)' })
    async issueCertificate(
        @Body('student_id') studentId: string,
        @Body('course_id') courseId: string,
    ) {
        return this.completionsService.issueCertificate(studentId, courseId);
    }

    @Post('lesson')
    @ApiOperation({ summary: 'Mark lesson as complete' })
    async markLessonComplete(
        @Body('lessonId') lessonId: string,
        @Request() req: any,
    ) {
        return this.completionsService.markLessonComplete(req.user.userId, lessonId);
    }


    @Post('tracking/time')
    @ApiOperation({ summary: 'Update time spent (Heartbeat)' })
    async updateTimeSpent(
        @Body('minutes') minutes: number,
        @Body('courseId') courseId: string,
        @Request() req: any,
    ) {
        return this.completionsService.updateTimeSpent(req.user.userId, minutes, courseId);
    }

    @Post('tracking/access')
    @ApiOperation({ summary: 'Log access to a course item' })
    async logAccess(
        @Body('courseId') courseId: string,
        @Body('itemId') itemId: string,
        @Request() req: any,
    ) {
        return this.completionsService.logAccess(req.user.userId, courseId, itemId);
    }
}
