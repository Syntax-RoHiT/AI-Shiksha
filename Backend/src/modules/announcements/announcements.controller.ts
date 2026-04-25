import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../enums/role.enum';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('announcements')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AnnouncementsController {
    constructor(
        private readonly announcementsService: AnnouncementsService,
        private readonly mailService: MailService,
        private readonly prisma: PrismaService,
    ) { }

    @Post('custom-email')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.FRANCHISE_ADMIN)
    async sendCustomEmail(@Req() req: any, @Body() body: { subject: string; message: string; targetRole?: string }) {
        const franchiseId = req.user.franchise_id || null;
        const { subject, message, targetRole } = body;

        const whereUsers: any = {};
        if (franchiseId) {
            whereUsers.franchise_id = franchiseId;
        }
        if (targetRole) {
            whereUsers.role = targetRole;
        }

        const usersToNotify = await this.prisma.user.findMany({
            where: whereUsers,
            select: { email: true, name: true, franchise_id: true }
        });

        // Fire and forget email delivery to avoid holding up the request
        this.mailService.sendPromotionalEmail(
            usersToNotify,
            franchiseId,
            subject,
            message
        );

        return { message: `Custom email queued for ${usersToNotify.length} users` };
    }

    @Post()
    @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.FRANCHISE_ADMIN)
    create(@Req() req: any, @Body() createAnnouncementDto: CreateAnnouncementDto) {
        const franchiseId = req.user.franchise_id || null;
        return this.announcementsService.create(req.user.userId, franchiseId, createAnnouncementDto);
    }

    @Get()
    @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.FRANCHISE_ADMIN)
    findAllForAdmin(@Req() req: any) {
        const franchiseId = req.user.franchise_id || null;
        return this.announcementsService.findAllForAdmin(franchiseId);
    }

    @Get('student')
    @Roles(Role.STUDENT, Role.INSTRUCTOR, Role.ADMIN, Role.SUPER_ADMIN, Role.FRANCHISE_ADMIN)
    findActiveForStudent(@Req() req: any) {
        const franchiseId = req.user.franchise_id || null;
        return this.announcementsService.findActiveForStudent(franchiseId);
    }

    @Patch(':id/toggle-status')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.FRANCHISE_ADMIN)
    toggleStatus(@Param('id') id: string, @Req() req: any) {
        const franchiseId = req.user.franchise_id || null;
        return this.announcementsService.toggleStatus(id, franchiseId);
    }

    @Delete(':id')
    @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.FRANCHISE_ADMIN)
    remove(@Param('id') id: string, @Req() req: any) {
        const franchiseId = req.user.franchise_id || null;
        return this.announcementsService.remove(id, franchiseId);
    }
}
