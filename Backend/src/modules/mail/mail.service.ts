import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import * as ejs from 'ejs';
import * as path from 'path';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    constructor(
        private readonly mailerService: MailerService,
        private readonly prisma: PrismaService,
    ) { }

    private async getFranchiseContext(franchiseId: string | null) {
        if (!franchiseId) {
            return {
                brandName: 'Expert Trainers Academy',
                brandLogo: 'https://experttrainersacademy.cloud/logo.png', // Fallback defaults
                primaryColor: '#4f46e5',
                supportEmail: 'support@experttrainersacademy.cloud',
            };
        }

        const franchise = await this.prisma.franchise.findUnique({
            where: { id: franchiseId },
            select: {
                name: true,
                logo_url: true,
                primary_color: true,
                support_email: true,
                lms_name: true,
            },
        });

        return {
            brandName: franchise?.lms_name || franchise?.name || 'Expert Trainers Academy',
            brandLogo: franchise?.logo_url || 'https://experttrainersacademy.cloud/logo.png',
            primaryColor: franchise?.primary_color || '#4f46e5',
            supportEmail: franchise?.support_email || 'support@experttrainersacademy.cloud',
        };
    }

    private async renderTemplate(type: string, fallbackTemplate: string, context: any) {
        if (context.franchise_id) {
            const customTemplate = await this.prisma.emailTemplate.findUnique({
                where: { type_franchise_id: { type, franchise_id: context.franchise_id } },
            });

            if (customTemplate) {
                // If the user has heavily customized it, we render it directly.
                // We'll wrap it in the header/footer automatically so the user just types the "body".
                const headerPath = path.join(__dirname, 'templates', 'header.ejs');
                const footerPath = path.join(__dirname, 'templates', 'footer.ejs');

                // Construct a full EJS string that includes the header and footer
                const fullTemplateString = `
<%- include('${headerPath}', locals) -%>
${customTemplate.body}
<%- include('${footerPath}', locals) -%>`;

                const html = ejs.render(fullTemplateString, context, { async: false });
                return { html, subject: customTemplate.subject };
            }
        }
        return { template: fallbackTemplate };
    }

    async sendWelcomeEmail(user: { email: string; name: string; franchise_id: string | null }) {
        try {
            const context = await this.getFranchiseContext(user.franchise_id);

            await this.mailerService.sendMail({
                to: user.email,
                replyTo: context.supportEmail,
                subject: `Welcome to ${context.brandName}!`,
                template: './welcome',
                context: {
                    name: user.name,
                    ...context,
                },
            });
            this.logger.log(`Welcome email sent to ${user.email}`);
        } catch (error) {
            this.logger.error(`Failed to send welcome email to ${user.email}`, error.stack);
        }
    }

    async sendNewRegistrationNotificationToAdmin(user: { email: string; name: string; franchise_id: string | null }) {
        try {
            const context = await this.getFranchiseContext(user.franchise_id);

            if (!context.supportEmail) return;

            const fullContext = {
                userName: user.name,
                userEmail: user.email,
                franchise_id: user.franchise_id,
                ...context,
            };

            const renderOptions = await this.renderTemplate('ADMIN_NEW_USER', './admin-new-user', fullContext);

            await this.mailerService.sendMail({
                to: context.supportEmail, // Send to Admin
                subject: renderOptions.subject || `New User Registration - ${context.brandName}`,
                ...(renderOptions.html ? { html: renderOptions.html } : { template: renderOptions.template }),
                context: fullContext,
            });
            this.logger.log(`Admin notification sent for new user ${user.email}`);
        } catch (error) {
            this.logger.error(`Failed to send admin notification for ${user.email}`, error.stack);
        }
    }

    async sendAdminAddedUserEmail(user: { email: string; name: string; plainToken: string; franchise_id: string | null }, loginUrl: string) {
        try {
            const context = await this.getFranchiseContext(user.franchise_id);

            const fullContext = {
                name: user.name,
                email: user.email,
                password: user.plainToken, // This assumes we pass the raw password right after generation
                loginUrl: loginUrl,
                franchise_id: user.franchise_id,
                ...context,
            };

            const renderOptions = await this.renderTemplate('ADMIN_ADDED_USER', './admin-added-user', fullContext);

            await this.mailerService.sendMail({
                to: user.email,
                replyTo: context.supportEmail,
                subject: renderOptions.subject || `Your Account Details for ${context.brandName}`,
                ...(renderOptions.html ? { html: renderOptions.html } : { template: renderOptions.template }),
                context: fullContext,
            });
            this.logger.log(`Credentials email sent to admin-added user ${user.email}`);
        } catch (error) {
            this.logger.error(`Failed to send credentials to ${user.email}`, error.stack);
        }
    }

    async sendCourseEnrollmentEmail(user: { email: string; name: string; franchise_id: string | null }, courseTitle: string) {
        try {
            const context = await this.getFranchiseContext(user.franchise_id);

            const fullContext = {
                name: user.name,
                courseTitle: courseTitle,
                franchise_id: user.franchise_id,
                ...context,
            };

            const renderOptions = await this.renderTemplate('ENROLLMENT', './enrollment', fullContext);

            await this.mailerService.sendMail({
                to: user.email,
                replyTo: context.supportEmail,
                subject: renderOptions.subject || `You're enrolled in: ${courseTitle}`,
                ...(renderOptions.html ? { html: renderOptions.html } : { template: renderOptions.template }),
                context: fullContext,
            });
            this.logger.log(`Enrollment email sent to ${user.email}`);
        } catch (error) {
            this.logger.error(`Failed to send enrollment email to ${user.email}`, error.stack);
        }
    }

    async sendCoursePurchaseEmail(user: { email: string; name: string; franchise_id: string | null }, courseTitle: string, amount: string) {
        try {
            const context = await this.getFranchiseContext(user.franchise_id);

            const userContext = {
                name: user.name,
                courseTitle,
                amount,
                franchise_id: user.franchise_id,
                ...context,
            };

            const userRenderOptions = await this.renderTemplate('PURCHASE_USER', './purchase-user', userContext);

            // Email to User
            await this.mailerService.sendMail({
                to: user.email,
                replyTo: context.supportEmail,
                subject: userRenderOptions.subject || `Purchase Confirmation: ${courseTitle}`,
                ...(userRenderOptions.html ? { html: userRenderOptions.html } : { template: userRenderOptions.template }),
                context: userContext,
            });

            // Email to Admin
            if (context.supportEmail) {
                const adminContext = {
                    userName: user.name,
                    userEmail: user.email,
                    courseTitle,
                    amount,
                    franchise_id: user.franchise_id,
                    ...context,
                };

                const adminRenderOptions = await this.renderTemplate('PURCHASE_ADMIN', './purchase-admin', adminContext);

                await this.mailerService.sendMail({
                    to: context.supportEmail,
                    subject: adminRenderOptions.subject || `New Course Purchase - ${courseTitle}`,
                    ...(adminRenderOptions.html ? { html: adminRenderOptions.html } : { template: adminRenderOptions.template }),
                    context: adminContext,
                });
            }
            this.logger.log(`Purchase emails sent for ${user.email}`);
        } catch (error) {
            this.logger.error(`Failed to send purchase emails for ${user.email}`, error.stack);
        }
    }

    async sendPasswordResetEmail(user: { email: string; name: string; franchise_id: string | null }, resetLink: string) {
        try {
            const context = await this.getFranchiseContext(user.franchise_id);

            const fullContext = {
                name: user.name,
                resetLink,
                franchise_id: user.franchise_id,
                ...context,
            };

            const renderOptions = await this.renderTemplate('PASSWORD_RESET', './password-reset', fullContext);

            await this.mailerService.sendMail({
                to: user.email,
                replyTo: context.supportEmail,
                subject: renderOptions.subject || `Password Reset Request - ${context.brandName}`,
                ...(renderOptions.html ? { html: renderOptions.html } : { template: renderOptions.template }),
                context: fullContext,
            });
            this.logger.log(`Password reset email sent to ${user.email}`);
        } catch (error) {
            this.logger.error(`Failed to send reset email to ${user.email}`, error.stack);
        }
    }

    async sendPromotionalEmail(users: { email: string; name: string }[], franchiseId: string | null, subject: string, messageBody: string) {
        try {
            const context = await this.getFranchiseContext(franchiseId);

            // We should ideally use a queue for bulk emails, but iterating for now
            for (const user of users) {
                const fullContext = {
                    name: user.name,
                    messageBody,
                    franchise_id: franchiseId,
                    ...context,
                };

                const renderOptions = await this.renderTemplate('PROMOTIONAL', './promotional', fullContext);

                await this.mailerService.sendMail({
                    to: user.email,
                    replyTo: context.supportEmail,
                    subject: renderOptions.subject || subject,
                    ...(renderOptions.html ? { html: renderOptions.html } : { template: renderOptions.template }),
                    context: fullContext,
                });
            }
            this.logger.log(`Promotional emails sent to ${users.length} users`);
        } catch (error) {
            this.logger.error(`Failed to send promotional emails`, error.stack);
        }
    }

    async sendCertificateEmail(user: { email: string; name: string; franchise_id: string | null }, courseTitle: string, certificateUrl: string) {
        try {
            const context = await this.getFranchiseContext(user.franchise_id);

            const fullContext = {
                name: user.name,
                courseTitle,
                certificateUrl,
                franchise_id: user.franchise_id,
                ...context,
            };

            const renderOptions = await this.renderTemplate('CERTIFICATE', './certificate', fullContext);

            await this.mailerService.sendMail({
                to: user.email,
                replyTo: context.supportEmail,
                subject: renderOptions.subject || `Your Certificate is Ready: ${courseTitle}`,
                ...(renderOptions.html ? { html: renderOptions.html } : { template: renderOptions.template }),
                context: fullContext,
            });
            this.logger.log(`Certificate email sent to ${user.email}`);
        } catch (error) {
            this.logger.error(`Failed to send certificate email to ${user.email}`, error.stack);
        }
    }

    async sendReviewSubmittedEmail(user: { email: string; name: string; franchise_id: string | null }, courseTitle: string) {
        try {
            const context = await this.getFranchiseContext(user.franchise_id);

            const fullContext = {
                name: user.name,
                courseTitle,
                franchise_id: user.franchise_id,
                ...context,
            };

            const renderOptions = await this.renderTemplate('REVIEW_SUBMITTED', './review-submitted', fullContext);

            await this.mailerService.sendMail({
                to: user.email,
                replyTo: context.supportEmail,
                subject: renderOptions.subject || `Thank you for reviewing ${courseTitle}`,
                ...(renderOptions.html ? { html: renderOptions.html } : { template: renderOptions.template }),
                context: fullContext,
            });
            this.logger.log(`Review email sent to ${user.email}`);
        } catch (error) {
            this.logger.error(`Failed to send review email to ${user.email}`, error.stack);
        }
    }

    async sendSupportTicketEmail(user: { email: string; name: string; franchise_id: string | null }, ticketId: string, ticketSubject: string) {
        try {
            const context = await this.getFranchiseContext(user.franchise_id);

            const fullContext = {
                name: user.name,
                ticketSubject,
                ticketId,
                franchise_id: user.franchise_id,
                ...context,
            };

            const renderOptions = await this.renderTemplate('SUPPORT_TICKET_USER', './support-ticket-user', fullContext);

            // To User
            await this.mailerService.sendMail({
                to: user.email,
                replyTo: context.supportEmail,
                subject: renderOptions.subject || `Support Ticket Received: [${ticketId}]`,
                ...(renderOptions.html ? { html: renderOptions.html } : { template: renderOptions.template }),
                context: fullContext,
            });
            this.logger.log(`Support ticket email sent for ${ticketId}`);
        } catch (error) {
            this.logger.error(`Failed to send support ticket email`, error.stack);
        }
    }

    async sendSupportTicketNotificationToAdmin(user: { email: string; name: string; franchise_id: string | null }, ticketId: string, ticketSubject: string, ticketDescription: string) {
        try {
            const context = await this.getFranchiseContext(user.franchise_id);

            // To Admin
            if (context.supportEmail) {
                const fullContext = {
                    userName: user.name,
                    userEmail: user.email,
                    ticketSubject,
                    ticketDescription,
                    ticketId,
                    franchise_id: user.franchise_id,
                    ...context,
                };

                const renderOptions = await this.renderTemplate('SUPPORT_TICKET_ADMIN', './support-ticket-admin', fullContext);

                await this.mailerService.sendMail({
                    to: context.supportEmail,
                    subject: renderOptions.subject || `New Support Ticket [${ticketId}]`,
                    ...(renderOptions.html ? { html: renderOptions.html } : { template: renderOptions.template }),
                    context: fullContext,
                });
            }
            this.logger.log(`Support ticket admin notification sent for ${ticketId}`);
        } catch (error) {
            this.logger.error(`Failed to send support ticket admin notification`, error.stack);
        }
    }

    async sendAnnouncementEmail(user: { email: string; name: string; franchise_id: string | null }, title: string, content: string, authorName: string, dashboardUrl: string) {
        try {
            const context = await this.getFranchiseContext(user.franchise_id);

            const fullContext = {
                name: user.name,
                title,
                content,
                authorName,
                dashboardUrl,
                franchise_id: user.franchise_id,
                ...context,
            };

            const renderOptions = await this.renderTemplate('ANNOUNCEMENT', './announcement', fullContext);

            await this.mailerService.sendMail({
                to: user.email,
                replyTo: context.supportEmail,
                subject: renderOptions.subject || `Announcement: ${title}`,
                ...(renderOptions.html ? { html: renderOptions.html } : { template: renderOptions.template }),
                context: fullContext,
            });
            this.logger.log(`Announcement emails sent to ${user.email}`);
        } catch (error) {
            this.logger.error(`Failed to send announcement email to ${user.email}`, error.stack);
        }
    }

    async sendQAAskedNotificationToAdmin(student: any, course: any, lesson: any, question: string, franchiseId: string | null) {
        try {
            const context = await this.getFranchiseContext(franchiseId);

            if (!context.supportEmail) return;

            const fullContext = {
                studentName: student.name,
                courseTitle: course.title,
                lessonTitle: lesson.title,
                question,
                franchise_id: franchiseId,
                ...context,
            };

            const renderOptions = await this.renderTemplate('QA_ASKED', './qa-asked', fullContext);

            await this.mailerService.sendMail({
                to: context.supportEmail, // Send to Admin
                subject: renderOptions.subject || `New Q/A Question in ${course.title}`,
                ...(renderOptions.html ? { html: renderOptions.html } : { template: renderOptions.template }),
                context: fullContext,
            });
            this.logger.log(`Admin notification sent for QA question in ${course.title}`);
        } catch (error) {
            this.logger.error(`Failed to send admin notification for QA`, error.stack);
        }
    }

    async sendQAReplyEmailToStudent(student: any, course: any, question: string, reply: string, franchiseId: string | null) {
        try {
            const context = await this.getFranchiseContext(franchiseId);

            const fullContext = {
                studentName: student.name,
                courseTitle: course.title,
                question,
                reply,
                franchise_id: franchiseId,
                ...context,
            };

            const renderOptions = await this.renderTemplate('QA_REPLY', './qa-reply', fullContext);

            await this.mailerService.sendMail({
                to: student.email,
                replyTo: context.supportEmail,
                subject: renderOptions.subject || `Reply to your question in ${course.title}`,
                ...(renderOptions.html ? { html: renderOptions.html } : { template: renderOptions.template }),
                context: fullContext,
            });
            this.logger.log(`QA Reply email sent to ${student.email}`);
        } catch (error) {
            this.logger.error(`Failed to send QA reply email to ${student.email}`, error.stack);
        }
    }

    // ==========================================
    // Custom Email Templates API Methods
    // ==========================================

    async getCustomTemplates(franchiseId: string | null) {
        const templates = await this.prisma.emailTemplate.findMany({
            where: { franchise_id: franchiseId },
        });

        return templates.reduce((acc, template) => {
            acc[template.type] = {
                subject: template.subject,
                body: template.body
            };
            return acc;
        }, {});
    }

    async upsertCustomTemplate(type: string, dto: UpdateEmailTemplateDto, franchiseId: string | null) {
        // franchise_id in schema is String? (optional) but the unique index expects a string. If it's null we should perhaps not do upsert on type_franchise_id unique directly if it causes TS errors with 'null', or we cast/bypass it. Actually, prisma allows explicit nulls for optional fields.
        // Wait, the TS error says: Type 'string | null' is not assignable to type 'string'. This means the unique compound index 'type_franchise_id' requires franchiseId to be a string. Wait, if it's optional, Prisma makes the WhereUniqueInput expect a string?
        // Let's use findFirst instead of findUnique to avoid the strict compound index type constraint if Prisma generated it strangely.
        const existing = await this.prisma.emailTemplate.findFirst({
            where: {
                type,
                franchise_id: franchiseId
            }
        });

        if (existing) {
            return this.prisma.emailTemplate.update({
                where: { id: existing.id },
                data: {
                    subject: dto.subject,
                    body: dto.body
                }
            });
        }

        let name = type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

        return this.prisma.emailTemplate.create({
            data: {
                name,
                type,
                subject: dto.subject,
                body: dto.body,
                franchise_id: franchiseId
            }
        });
    }
}

