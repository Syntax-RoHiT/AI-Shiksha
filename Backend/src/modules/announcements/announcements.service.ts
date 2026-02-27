import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AnnouncementsService {
    constructor(
        private prisma: PrismaService,
        private mailService: MailService,
    ) { }

    async create(userId: string, franchiseId: string | null, createAnnouncementDto: CreateAnnouncementDto) {
        const announcement = await this.prisma.announcement.create({
            data: {
                title: createAnnouncementDto.title,
                content: createAnnouncementDto.content,
                is_active: createAnnouncementDto.is_active ?? true,
                created_by: userId,
                franchise_id: franchiseId,
            },
        });

        // Broadcast to specific franchise if defined, else to ALL users
        const whereUsers: any = {};
        if (franchiseId) {
            whereUsers.franchise_id = franchiseId;
        }

        const usersToNotify = await this.prisma.user.findMany({
            where: whereUsers,
            select: { email: true, name: true, franchise_id: true }
        });

        const author = await this.prisma.user.findUnique({ where: { id: userId }, select: { name: true } });

        // Fire and forget email delivery to avoid holding up the request
        Promise.all(usersToNotify.map(user =>
            this.mailService.sendAnnouncementEmail(
                { email: user.email, name: user.name, franchise_id: user.franchise_id },
                announcement.title,
                announcement.content,
                author?.name || 'Admin',
                `${process.env.FRONTEND_URL || 'https://experttrainersacademy.cloud'}/dashboard`
            )
        )).catch(err => console.error("Error broadcasting announcement emails:", err));

        return announcement;
    }

    async findAllForAdmin(franchiseId: string | null) {
        const whereClause: any = {};
        if (franchiseId) {
            whereClause.franchise_id = franchiseId;
        }

        return this.prisma.announcement.findMany({
            where: whereClause,
            include: {
                author: {
                    select: { name: true, avatar_url: true },
                },
            },
            orderBy: { created_at: 'desc' },
        });
    }

    async findActiveForStudent(franchiseId: string | null) {
        // Provide general announcements (null franchise_id) + student's franchise specific
        return this.prisma.announcement.findMany({
            where: {
                is_active: true,
                OR: [
                    { franchise_id: franchiseId },
                    { franchise_id: null },
                ]
            },
            include: {
                author: {
                    select: { name: true, avatar_url: true },
                },
            },
            orderBy: { created_at: 'desc' },
        });
    }

    async toggleStatus(id: string, franchiseId: string | null) {
        const announcement = await this.prisma.announcement.findUnique({
            where: { id },
        });

        if (!announcement) throw new NotFoundException('Announcement not found');

        if (franchiseId && announcement.franchise_id !== franchiseId) {
            throw new ForbiddenException('Access denied');
        }

        return this.prisma.announcement.update({
            where: { id },
            data: { is_active: !announcement.is_active },
        });
    }

    async remove(id: string, franchiseId: string | null) {
        const announcement = await this.prisma.announcement.findUnique({
            where: { id },
        });

        if (!announcement) throw new NotFoundException('Announcement not found');

        if (franchiseId && announcement.franchise_id !== franchiseId) {
            throw new ForbiddenException('Access denied');
        }

        return this.prisma.announcement.delete({
            where: { id },
        });
    }
}
