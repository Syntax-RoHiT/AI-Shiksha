import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { AddMessageDto } from './dto/add-message.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class SupportService {
    constructor(
        private prisma: PrismaService,
        private mailService: MailService,
    ) { }

    async createTicket(studentId: string, franchiseId: string | null, createTicketDto: CreateTicketDto) {
        if (!studentId) {
            throw new ForbiddenException('Student ID is required');
        }

        const ticket = await this.prisma.supportTicket.create({
            data: {
                student_id: studentId,
                franchise_id: franchiseId,
                subject: createTicketDto.subject,
                description: createTicketDto.description,
                priority: createTicketDto.priority || 'MEDIUM',
            },
        });

        // Add the initial description as the first message
        await this.prisma.supportTicketMessage.create({
            data: {
                ticket_id: ticket.id,
                sender_id: studentId,
                message: createTicketDto.description,
                is_admin: false,
            },
        });

        const student = await this.prisma.user.findUnique({ where: { id: studentId } });
        if (student) {
            this.mailService.sendSupportTicketEmail(
                { email: student.email, name: student.name, franchise_id: franchiseId },
                ticket.id,
                ticket.subject
            );

            this.mailService.sendSupportTicketNotificationToAdmin(
                { email: student.email, name: student.name, franchise_id: franchiseId },
                ticket.id,
                ticket.subject,
                ticket.description
            );
        }

        return ticket;
    }

    async getStudentTickets(studentId: string) {
        return this.prisma.supportTicket.findMany({
            where: { student_id: studentId },
            include: {
                _count: {
                    select: { messages: true },
                },
            },
            orderBy: { updated_at: 'desc' },
        });
    }

    async getAdminTickets(franchiseId: string | null) {
        const whereClause: any = {};
        if (franchiseId) {
            whereClause.franchise_id = franchiseId;
        }

        return this.prisma.supportTicket.findMany({
            where: whereClause,
            include: {
                student: {
                    select: { name: true, email: true, avatar_url: true },
                },
                _count: {
                    select: { messages: true },
                },
            },
            orderBy: { updated_at: 'desc' },
        });
    }

    async getTicketDetails(ticketId: string, userId: string, role: string, franchiseId: string | null) {
        const ticket = await this.prisma.supportTicket.findUnique({
            where: { id: ticketId },
            include: {
                student: {
                    select: { name: true, email: true, avatar_url: true },
                },
                messages: {
                    include: {
                        sender: {
                            select: { name: true, role: true, avatar_url: true },
                        },
                    },
                    orderBy: { created_at: 'asc' },
                },
                franchise: {
                    select: { name: true },
                }
            },
        });

        if (!ticket) {
            throw new NotFoundException('Ticket not found');
        }

        // Access control:
        if (role === 'STUDENT' && ticket.student_id !== userId) {
            throw new ForbiddenException('Access denied');
        }

        if (role !== 'STUDENT' && franchiseId && ticket.franchise_id !== franchiseId) {
            throw new ForbiddenException('Access denied');
        }

        return ticket;
    }

    async addMessage(ticketId: string, userId: string, role: string, franchiseId: string | null, addMessageDto: AddMessageDto) {
        const ticket = await this.getTicketDetails(ticketId, userId, role, franchiseId);

        if (ticket.status === 'CLOSED') {
            throw new ForbiddenException('Cannot reply to a closed ticket');
        }

        const isAdmin = role !== 'STUDENT';

        const message = await this.prisma.supportTicketMessage.create({
            data: {
                ticket_id: ticketId,
                sender_id: userId,
                message: addMessageDto.message,
                is_admin: isAdmin,
            },
            include: {
                sender: {
                    select: { name: true, role: true, avatar_url: true },
                },
            }
        });

        const newStatus = isAdmin ? 'IN_PROGRESS' : 'OPEN';
        await this.prisma.supportTicket.update({
            where: { id: ticketId },
            data: { status: newStatus },
        });

        return message;
    }

    async closeTicket(ticketId: string, userId: string, role: string, franchiseId: string | null) {
        await this.getTicketDetails(ticketId, userId, role, franchiseId);

        return this.prisma.supportTicket.update({
            where: { id: ticketId },
            data: {
                status: 'CLOSED',
                closed_at: new Date(),
            },
        });
    }
}
