import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateQaDto } from './dto/create-qa.dto';
import { ReplyQaDto } from './dto/reply-qa.dto';

@Injectable()
export class QaService {
    constructor(
        private prisma: PrismaService,
        private mailService: MailService,
    ) {}

    async askQuestion(studentId: string, franchiseId: string | null, createQaDto: CreateQaDto) {
        const lesson = await this.prisma.sectionItem.findUnique({
            where: { id: createQaDto.lesson_id },
            include: { section: { include: { course: true } } }
        });

        if (!lesson) throw new NotFoundException('Lesson not found');
        const courseId = lesson.section.course_id;

        const qa = await this.prisma.courseQA.create({
            data: {
                course_id: courseId,
                lesson_id: createQaDto.lesson_id,
                student_id: studentId,
                question: createQaDto.question,
                franchise_id: franchiseId
            },
            include: { student: true, lesson: true, course: true }
        });

        this.mailService.sendQAAskedNotificationToAdmin(qa.student, qa.course, qa.lesson, qa.question, franchiseId);

        return qa;
    }

    async getLessonQuestions(lessonId: string, franchiseId: string | null) {
        const whereClause: any = { lesson_id: lessonId };
        if (franchiseId) {
            whereClause.franchise_id = franchiseId;
        }

        return this.prisma.courseQA.findMany({
            where: whereClause,
            include: {
                student: { select: { name: true, avatar_url: true } },
                replies: {
                    include: {
                        user: { select: { name: true, avatar_url: true, role: true } }
                    },
                    orderBy: { created_at: 'asc' }
                }
            },
            orderBy: { created_at: 'desc' }
        });
    }

    async getAdminCourses(franchiseId: string | null) {
        const whereClause: any = {};
        if (franchiseId) {
            whereClause.franchise_id = franchiseId;
        }

        return this.prisma.course.findMany({
            where: {
                ...whereClause,
                qa_questions: { some: {} }
            },
            include: {
                _count: {
                    select: { qa_questions: true }
                }
            }
        });
    }

    async getCourseQuestions(courseId: string, franchiseId: string | null) {
        const whereClause: any = { course_id: courseId };
        if (franchiseId) {
            whereClause.franchise_id = franchiseId;
        }

        return this.prisma.courseQA.findMany({
            where: whereClause,
            include: {
                student: { select: { name: true, avatar_url: true } },
                lesson: { select: { title: true } },
                replies: {
                    include: {
                        user: { select: { name: true, avatar_url: true, role: true } }
                    },
                    orderBy: { created_at: 'asc' }
                }
            },
            orderBy: { created_at: 'desc' }
        });
    }

    async replyQuestion(qaId: string, userId: string, franchiseId: string | null, replyQaDto: ReplyQaDto) {
        const whereClause: any = { id: qaId };
        if (franchiseId) {
            whereClause.franchise_id = franchiseId;
        }

        const qa = await this.prisma.courseQA.findUnique({
            where: whereClause,
            include: { student: true, course: true, lesson: true }
        });

        if (!qa) throw new NotFoundException('Q/A not found');

        const reply = await this.prisma.courseQAReply.create({
            data: {
                qa_id: qaId,
                user_id: userId,
                reply: replyQaDto.reply,
                is_admin: true
            }
        });

        await this.prisma.courseQA.update({
            where: { id: qaId },
            data: { status: 'ANSWERED' }
        });

        this.mailService.sendQAReplyEmailToStudent(qa.student, qa.course, qa.question, reply.reply, franchiseId);

        return reply;
    }
}
