import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { QaService } from './qa.service';
import { CreateQaDto } from './dto/create-qa.dto';
import { ReplyQaDto } from './dto/reply-qa.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../enums/role.enum';

@Controller('qa')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class QaController {
    constructor(private readonly qaService: QaService) {}

    @Post('lesson')
    @Roles(Role.STUDENT, Role.INSTRUCTOR, Role.ADMIN, Role.FRANCHISE_ADMIN, Role.SUPER_ADMIN)
    askQuestion(@Req() req: any, @Body() createQaDto: CreateQaDto) {
        const franchiseId = req.user.franchise_id || null;
        return this.qaService.askQuestion(req.user.userId, franchiseId, createQaDto);
    }

    @Get('lesson/:lessonId')
    @Roles(Role.STUDENT, Role.INSTRUCTOR, Role.ADMIN, Role.FRANCHISE_ADMIN, Role.SUPER_ADMIN)
    getLessonQuestions(@Param('lessonId') lessonId: string, @Req() req: any) {
        const franchiseId = req.user.franchise_id || null;
        return this.qaService.getLessonQuestions(lessonId, franchiseId);
    }

    @Get('admin/courses')
    @Roles(Role.INSTRUCTOR, Role.ADMIN, Role.FRANCHISE_ADMIN, Role.SUPER_ADMIN)
    getAdminCourses(@Req() req: any) {
        const franchiseId = req.user.franchise_id || null;
        return this.qaService.getAdminCourses(franchiseId);
    }

    @Get('admin/course/:courseId')
    @Roles(Role.INSTRUCTOR, Role.ADMIN, Role.FRANCHISE_ADMIN, Role.SUPER_ADMIN)
    getCourseQuestions(@Param('courseId') courseId: string, @Req() req: any) {
        const franchiseId = req.user.franchise_id || null;
        return this.qaService.getCourseQuestions(courseId, franchiseId);
    }

    @Post('admin/:qaId/reply')
    @Roles(Role.INSTRUCTOR, Role.ADMIN, Role.FRANCHISE_ADMIN, Role.SUPER_ADMIN)
    replyQuestion(@Param('qaId') qaId: string, @Body() replyQaDto: ReplyQaDto, @Req() req: any) {
        const franchiseId = req.user.franchise_id || null;
        return this.qaService.replyQuestion(qaId, req.user.userId, franchiseId, replyQaDto);
    }
}
