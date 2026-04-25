import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class CompletionsService {
    constructor(
        private prisma: PrismaService,
        private mailService: MailService,
    ) { }

    // Get all course completions with student and course info
    async findAll(search?: string, franchiseId?: string) {
        const where: any = {
            completed: true,
        };

        // Franchise isolation: scope by the franchise the course belongs to
        if (franchiseId !== undefined) {
            where.course = { franchise_id: franchiseId };
        }

        // Add search filter if provided
        if (search) {
            where.OR = [
                { user: { name: { contains: search, mode: 'insensitive' } } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
                { course: { title: { contains: search, mode: 'insensitive' } } },
            ];
        }

        const completions = await this.prisma.courseProgress.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar_url: true,
                    },
                },
                course: {
                    select: {
                        id: true,
                        title: true,
                        certificate_enabled: true,
                        certificate_title: true,
                    },
                },
            },
            orderBy: {
                updated_at: 'desc',
            },
        });

        // Enrich with certificate data
        const enriched = await Promise.all(
            completions.map(async (completion) => {
                const certificate = await this.prisma.certificate.findFirst({
                    where: {
                        student_id: completion.student_id,
                        course_id: completion.course_id,
                    },
                });

                return {
                    id: completion.id,
                    student: completion.user,
                    course: completion.course,
                    completed_at: completion.updated_at,
                    progress_percentage: completion.progress_percentage,
                    certificate_issued: !!certificate,
                    certificate_id: certificate?.id,
                    certificate_url: certificate?.certificate_url,
                };
            }),
        );

        return enriched;
    }

    // Get completion statistics
    async getStats(franchiseId?: string) {
        const courseFilter = franchiseId !== undefined ? { course: { franchise_id: franchiseId } } : {};
        const courseCountFilter = franchiseId !== undefined ? { franchise_id: franchiseId } : {};

        const totalCompletions = await this.prisma.courseProgress.count({
            where: { completed: true, ...courseFilter },
        });

        const certificatesIssued = await this.prisma.certificate.count({
            where: { ...courseCountFilter },
        });

        // Calculate average score (placeholder - would need quiz/assessment system)
        const avgScore = 86;

        // Completions this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const thisMonth = await this.prisma.courseProgress.count({
            where: {
                completed: true,
                updated_at: {
                    gte: startOfMonth,
                },
                ...courseFilter,
            },
        });

        return {
            total_completions: totalCompletions,
            certificates_issued: certificatesIssued,
            avg_score: avgScore,
            this_month: thisMonth,
        };
    }

    // Manually mark course as complete and auto-issue certificate
    async markComplete(studentId: string, courseId: string, adminUserId: string) {
        // Verify student exists
        const student = await this.prisma.user.findUnique({
            where: { id: studentId },
        });

        if (!student) {
            throw new NotFoundException('Student not found');
        }

        // Verify course exists
        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
        });

        if (!course) {
            throw new NotFoundException('Course not found');
        }

        // Check if student is enrolled
        const enrollment = await this.prisma.enrollment.findFirst({
            where: {
                student_id: studentId,
                course_id: courseId,
            },
        });

        if (!enrollment) {
            throw new BadRequestException('Student is not enrolled in this course');
        }

        // Update or create course progress
        const progress = await this.prisma.courseProgress.upsert({
            where: {
                student_id_course_id: {
                    student_id: studentId,
                    course_id: courseId,
                },
            },
            update: {
                completed: true,
                progress_percentage: 100,
                updated_at: new Date(),
            },
            create: {
                student_id: studentId,
                course_id: courseId,
                completed: true,
                progress_percentage: 100,
            },
            include: {
                user: true,
                course: true,
            },
        });

        // Update Enrollment with total time (estimated)
        if (course.estimated_duration) {
            await this.prisma.enrollment.updateMany({
                where: {
                    student_id: studentId,
                    course_id: courseId,
                },
                data: {
                    total_learning_time: course.estimated_duration,
                    completed_at: new Date(),
                    progress_percentage: 100,
                    status: 'completed',
                },
            });
        } else {
            await this.prisma.enrollment.updateMany({
                where: {
                    student_id: studentId,
                    course_id: courseId,
                },
                data: {
                    completed_at: new Date(),
                    progress_percentage: 100,
                    status: 'completed',
                },
            });
        }

        // Auto-complete all lessons and section items
        // 1. Get all lessons (Legacy)
        const lessons = await this.prisma.lesson.findMany({
            where: { module: { course_id: courseId } },
            select: { id: true }
        });

        // 2. Get all section items (New)
        const sectionItems = await this.prisma.sectionItem.findMany({
            where: { section: { course_id: courseId } },
            select: { id: true }
        });

        const now = new Date();

        // 3. Mark all lessons as complete
        if (lessons.length > 0) {
            // Using transaction for bulk upsert loop might be heavy, but Prisma createMany doesn't support 'skipDuplicates' broadly enough for progress tracking sometimes
            // Logic: we want to ensure they exist. modify if exists, create if not.
            // For bulk mark complete, we can just use createMany with skipDuplicates if supported, or iterate.
            // Loop is safest for upsert logic correctness across DBs without raw SQL.
            for (const lesson of lessons) {
                await this.prisma.lessonProgress.upsert({
                    where: {
                        student_id_lesson_id: {
                            student_id: studentId,
                            lesson_id: lesson.id,
                        },
                    },
                    update: { completed: true, completed_at: now },
                    create: {
                        student_id: studentId,
                        lesson_id: lesson.id,
                        completed: true,
                        completed_at: now,
                    },
                });
            }
        }

        // 4. Mark all section items as complete
        if (sectionItems.length > 0) {
            for (const item of sectionItems) {
                await this.prisma.sectionItemProgress.upsert({
                    where: {
                        student_id_item_id: {
                            student_id: studentId,
                            item_id: item.id,
                        },
                    },
                    update: { completed: true, completed_at: now },
                    create: {
                        student_id: studentId,
                        item_id: item.id,
                        completed: true,
                        completed_at: now,
                    },
                });
            }
        }

        // Auto-issue certificate if enabled
        let certificate: any = null;

        if (course.certificate_enabled) {
            // Check if certificate already exists
            const existingCert = await this.prisma.certificate.findFirst({
                where: {
                    student_id: studentId,
                    course_id: courseId,
                },
            });

            if (!existingCert) {
                // Generate unique certificate number
                const timestamp = Date.now();
                const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
                const certificateNumber = `CERT-${new Date().getFullYear()}-${randomSuffix}${timestamp.toString().slice(-4)}`;

                // Generate QR validation URL
                const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
                const qrValidationUrl = `${baseUrl}/courses/${course.slug}/validation/${studentId}`;

                certificate = await this.prisma.certificate.create({
                    data: {
                        student_id: studentId,
                        course_id: courseId,
                        certificate_number: certificateNumber,
                        qr_validation_url: qrValidationUrl,
                        issued_at: new Date(),
                        certificate_url: `/certificates/${studentId}/${courseId}/download`,
                        franchise_id: course.franchise_id, // Inherit franchise from course
                    },
                });
                // Update with proper ID-based download URL
                certificate = await this.prisma.certificate.update({
                    where: { id: certificate.id },
                    data: { certificate_url: `/certificates/${certificate.id}/download` },
                });
            } else {
                certificate = existingCert;
            }
        }

        // Send completion + certificate email to student
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const certificateUrl = certificate
            ? `${baseUrl}/dashboard/certificates`
            : undefined;

        if (certificateUrl) {
            this.mailService.sendCertificateEmail(
                { email: student.email, name: student.name, franchise_id: student.franchise_id },
                course.title,
                certificateUrl,
            ).catch(err => console.error('Failed to send certificate email:', err));
        } else {
            // No certificate but still notify of completion
            this.mailService.sendSupportNotification(
                { email: student.email, name: student.name, franchise_id: student.franchise_id },
                `Congratulations! You completed ${course.title}`,
                `You have successfully completed the course "${course.title}". Keep up the great work!`,
            ).catch(err => console.error('Failed to send completion email:', err));
        }

        return {
            progress,
            certificate,
            message: certificate
                ? 'Course marked as complete and certificate issued'
                : course.certificate_enabled
                    ? 'Course marked as complete (Certificate failed to issue)'
                    : 'Course marked as complete (Certificates disabled for this course)',
        };
    }

    // Issue certificate for a completed course
    async issueCertificate(studentId: string, courseId: string) {
        // Verify completion
        const progress = await this.prisma.courseProgress.findFirst({
            where: {
                student_id: studentId,
                course_id: courseId,
                completed: true,
            },
            include: {
                user: true,
                course: true,
            },
        });

        if (!progress) {
            throw new BadRequestException('Course not completed by this student');
        }

        if (!progress.course.certificate_enabled) {
            throw new BadRequestException('Certificates are not enabled for this course');
        }

        // Check if certificate already exists
        const existing = await this.prisma.certificate.findFirst({
            where: {
                student_id: studentId,
                course_id: courseId,
            },
        });

        if (existing) {
            return {
                certificate: existing,
                message: 'Certificate already issued',
            };
        }

        // Generate unique certificate number
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
        const certificateNumber = `CERT-${new Date().getFullYear()}-${randomSuffix}${timestamp.toString().slice(-4)}`;

        // Get course slug for QR URL
        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
            select: { slug: true, franchise_id: true, title: true },
        });

        // Generate QR validation URL
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const qrValidationUrl = course ? `${baseUrl}/courses/${course.slug}/validation/${studentId}` : null;

        // Create certificate
        let certificate = await this.prisma.certificate.create({
            data: {
                student_id: studentId,
                course_id: courseId,
                certificate_number: certificateNumber,
                qr_validation_url: qrValidationUrl,
                issued_at: new Date(),
                certificate_url: `/certificates/${studentId}/${courseId}/download`,
                franchise_id: course?.franchise_id,
            },
            include: { user: true },
        });
        // Update with the real ID-based download URL
        certificate = await this.prisma.certificate.update({
            where: { id: certificate.id },
            data: { certificate_url: `/certificates/${certificate.id}/download` },
            include: { user: true },
        });

        // Send certificate email - link to frontend dashboard so student can download
        const certEmailUrl = `${baseUrl}/dashboard/certificates`;
        this.mailService.sendCertificateEmail(
            { email: certificate.user.email, name: certificate.user.name, franchise_id: certificate.user.franchise_id },
            course?.title || 'Your Course',
            certEmailUrl
        );

        return {
            certificate,
            message: 'Certificate issued successfully',
        };
    }

    async markLessonComplete(studentId: string, lessonId: string) {
        // Find lesson and related course
        const lesson = await this.prisma.lesson.findUnique({
            where: { id: lessonId },
            include: { module: { include: { course: true } } },
        });

        if (!lesson) {
            // Try to find as SectionItem if not found as Lesson
            return this.markSectionItemComplete(studentId, lessonId);
        }

        const courseId = lesson.module.course.id;

        // Verify enrollment
        const enrollment = await this.prisma.enrollment.findUnique({
            where: {
                student_id_course_id: {
                    student_id: studentId,
                    course_id: courseId,
                },
            },
        });

        if (!enrollment || !['active', 'completed'].includes(enrollment.status)) {
            throw new BadRequestException('Student is not enrolled in this course');
        }

        // Update lesson progress
        const progress = await this.prisma.lessonProgress.upsert({
            where: {
                student_id_lesson_id: {
                    student_id: studentId,
                    lesson_id: lessonId,
                },
            },
            update: {
                completed: true,
                completed_at: new Date(),
            },
            create: {
                student_id: studentId,
                lesson_id: lessonId,
                completed: true,
                completed_at: new Date(),
            },
        });

        // Recalculate course progress
        await this.updateCourseProgress(studentId, courseId);

        return progress;
    }

    async markSectionItemComplete(studentId: string, itemId: string) {
        // Find item and related course
        const item = await this.prisma.sectionItem.findUnique({
            where: { id: itemId },
            include: { section: { include: { course: true } } },
        });

        if (!item) {
            throw new NotFoundException('Lesson not found');
        }

        const courseId = item.section.course.id;

        // Verify enrollment
        const enrollment = await this.prisma.enrollment.findUnique({
            where: {
                student_id_course_id: {
                    student_id: studentId,
                    course_id: courseId,
                },
            },
        });

        if (!enrollment || !['active', 'completed'].includes(enrollment.status)) {
            throw new BadRequestException('Student is not enrolled in this course');
        }

        // Update section item progress
        const progress = await this.prisma.sectionItemProgress.upsert({
            where: {
                student_id_item_id: {
                    student_id: studentId,
                    item_id: itemId,
                },
            },
            update: {
                completed: true,
                completed_at: new Date(),
            },
            create: {
                student_id: studentId,
                item_id: itemId,
                completed: true,
                completed_at: new Date(),
            },
        });

        // Recalculate course progress
        await this.updateCourseProgress(studentId, courseId);

        return progress;
    }

    private async updateCourseProgress(studentId: string, courseId: string) {
        // Get total lessons (Legacy)
        const totalLessons = await this.prisma.lesson.count({
            where: {
                module: {
                    course_id: courseId,
                },
            },
        });

        // Get total section items (New)
        const totalSectionItems = await this.prisma.sectionItem.count({
            where: {
                section: {
                    course_id: courseId,
                },
            },
        });

        const totalItems = totalLessons + totalSectionItems;

        if (totalItems === 0) return;

        // Get completed lessons (Legacy)
        const completedLessons = await this.prisma.lessonProgress.count({
            where: {
                student_id: studentId,
                completed: true,
                lesson: {
                    module: {
                        course_id: courseId,
                    },
                },
            },
        });

        // Get completed section items (New)
        const completedSectionItems = await this.prisma.sectionItemProgress.count({
            where: {
                student_id: studentId,
                completed: true,
                item: {
                    section: {
                        course_id: courseId,
                    },
                },
            },
        });

        const completedItems = completedLessons + completedSectionItems;

        const percentage = (completedItems / totalItems) * 100;
        const isComplete = percentage === 100;

        // Update Course Progress
        await this.prisma.courseProgress.upsert({
            where: {
                student_id_course_id: {
                    student_id: studentId,
                    course_id: courseId,
                },
            },
            update: {
                progress_percentage: percentage,
                completed: isComplete,
                updated_at: new Date(),
            },
            create: {
                student_id: studentId,
                course_id: courseId,
                progress_percentage: percentage,
                completed: isComplete,
            },
        });

        // Update Enrollment progress + status
        await this.prisma.enrollment.update({
            where: {
                student_id_course_id: {
                    student_id: studentId,
                    course_id: courseId,
                },
            },
            data: {
                progress_percentage: Math.round(percentage),
                completed_at: isComplete ? new Date() : undefined,
                last_activity_at: new Date(),
                // KEY FIX: set status to 'completed' when 100% reached
                ...(isComplete ? { status: 'completed' } : {}),
            },
        });

        // Auto-generate certificate if course is complete and certificates are enabled
        if (isComplete) {
            await this.generateCertificateOnCompletion(studentId, courseId);
        }

    }

    private async generateCertificateOnCompletion(studentId: string, courseId: string) {
        try {
            // Get course details including franchise_id for isolation
            const course = await this.prisma.course.findUnique({
                where: { id: courseId },
                select: {
                    certificate_enabled: true,
                    slug: true,
                    title: true,
                    franchise_id: true,
                },
            });

            if (!course || !course.certificate_enabled) {
                return; // Certificates not enabled for this course
            }

            // Check if certificate already exists
            const existingCert = await this.prisma.certificate.findFirst({
                where: {
                    student_id: studentId,
                    course_id: courseId,
                },
            });

            if (existingCert) {
                return; // Certificate already issued
            }

            // Generate unique certificate number
            const timestamp = Date.now();
            const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
            const certificateNumber = `CERT-${new Date().getFullYear()}-${randomSuffix}${timestamp.toString().slice(-4)}`;

            // Generate QR validation URL
            const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const qrValidationUrl = `${baseUrl}/courses/${course.slug}/validation/${studentId}`;

            // Create certificate — KEY FIX: include franchise_id for proper isolation
            let certificate = await this.prisma.certificate.create({
                data: {
                    student_id: studentId,
                    course_id: courseId,
                    certificate_number: certificateNumber,
                    qr_validation_url: qrValidationUrl,
                    certificate_url: `/certificates/${studentId}/${courseId}/download`,
                    issued_at: new Date(),
                    franchise_id: course.franchise_id,
                },
                include: { user: true },
            });

            // Update with proper ID-based download URL
            certificate = await this.prisma.certificate.update({
                where: { id: certificate.id },
                data: { certificate_url: `/certificates/${certificate.id}/download` },
                include: { user: true },
            });

            // Send certificate email - link to frontend dashboard
            this.mailService.sendCertificateEmail(
                { email: certificate.user.email, name: certificate.user.name, franchise_id: certificate.user.franchise_id },
                course.title,
                `${baseUrl}/dashboard/certificates`
            );
        } catch (error) {
            console.error('Error generating certificate on completion:', error);
            // Don't throw - certificate generation shouldn't block completion
        }
    }

    async logAccess(studentId: string, courseId: string, itemId: string) {
        // Verify enrollment
        const enrollment = await this.prisma.enrollment.findUnique({
            where: {
                student_id_course_id: {
                    student_id: studentId,
                    course_id: courseId,
                },
            },
        });

        if (!enrollment || !['active', 'completed'].includes(enrollment.status)) {
            throw new BadRequestException('Student is not enrolled in this course');
        }

        // Update Course Progress
        await this.prisma.courseProgress.upsert({
            where: {
                student_id_course_id: {
                    student_id: studentId,
                    course_id: courseId,
                },
            },
            update: {
                last_accessed_at: new Date(),
                last_accessed_item_id: itemId,
            },
            create: {
                student_id: studentId,
                course_id: courseId,
                last_accessed_at: new Date(),
                last_accessed_item_id: itemId,
            },
        });

        // Update Enrollment
        await this.prisma.enrollment.update({
            where: {
                student_id_course_id: {
                    student_id: studentId,
                    course_id: courseId,
                },
            },
            data: {
                last_activity_at: new Date(),
            },
        });

        return { success: true };
    }

    async updateTimeSpent(studentId: string, durationMinutes: number, courseId?: string) {
        if (durationMinutes <= 0) return;

        // Update User's weekly minutes
        await this.prisma.user.update({
            where: { id: studentId },
            data: {
                weekly_minutes_spent: {
                    increment: durationMinutes,
                },
            },
        });

        // Update Enrollment total time if course specified
        if (courseId) {
            // We use updateMany because composite unique constraint on Enrollment is [student_id, course_id]
            // but prisma update requires unique where input.
            // Actually Enrollment has student_id_course_id composite unique.
            try {
                await this.prisma.enrollment.update({
                    where: {
                        student_id_course_id: {
                            student_id: studentId,
                            course_id: courseId,
                        },
                    },
                    data: {
                        total_learning_time: {
                            increment: durationMinutes,
                        },
                        last_activity_at: new Date(),
                    },
                });
            } catch (e) {
                // Ignore if enrollment not found (e.g. preview mode or error)
            }
        }

        return { success: true };
    }
}
