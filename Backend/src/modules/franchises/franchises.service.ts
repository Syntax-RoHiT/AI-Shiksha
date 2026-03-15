import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFranchiseDto } from './dto/create-franchise.dto';
import { UpdateFranchiseDto } from './dto/update-franchise.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class FranchisesService {
    constructor(private prisma: PrismaService) { }

    /**
     * List all franchises (SUPER_ADMIN only)
     */
    async findAll() {
        const franchises = await this.prisma.franchise.findMany({
            orderBy: { created_at: 'desc' },
            include: {
                _count: {
                    select: { users: true, courses: true, enrollments: true },
                },
            },
        });
        return franchises;
    }

    /**
     * Get a single franchise by ID
     */
    async findOne(id: string) {
        const franchise = await this.prisma.franchise.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { users: true, courses: true, enrollments: true },
                },
            },
        });
        if (!franchise) throw new NotFoundException('Franchise not found');
        return franchise;
    }

    /**
     * Get branding info for a given domain (public endpoint)
     */
    async getBrandingByDomain(domain: string) {
        // Normalize domain (strip port for local dev)
        const normalizedDomain = domain.split(':')[0];

        let franchise = await this.prisma.franchise.findFirst({
            where: {
                OR: [
                    { domain: normalizedDomain },
                    { domain: domain },
                ],
                is_active: true,
            },
            select: {
                id: true,
                name: true,
                lms_name: true,
                logo_url: true,
                favicon_url: true,
                primary_color: true,
                support_email: true,
                domain_verified: true,
                maintenance_mode: true,
                description: true,
                seo_title: true,
                seo_description: true,
                seo_keywords: true,
            },
        });

        // If not found, it is likely the master system domain (e.g., iconsafetyinstitute.com)
        // Master settings are stored under the 'localhost' domain record.
        if (!franchise) {
            franchise = await this.prisma.franchise.findFirst({
                where: {
                    domain: 'localhost',
                    is_active: true,
                },
                select: {
                    id: true,
                    name: true,
                    lms_name: true,
                    logo_url: true,
                    favicon_url: true,
                    primary_color: true,
                    support_email: true,
                    domain_verified: true,
                    maintenance_mode: true,
                    description: true,
                    seo_title: true,
                    seo_description: true,
                    seo_keywords: true,
                },
            });
        }

        if (!franchise) {
            // Return default branding if no franchise found
            return {
                id: null,
                name: 'AI Shiksha',
                lms_name: 'AI Shiksha',
                logo_url: null,
                favicon_url: null,
                primary_color: '#6366f1',
                support_email: null,
                domain_verified: false,
                maintenance_mode: false,
                description: null,
                seo_title: null,
                seo_description: null,
                seo_keywords: null,
            };
        }

        return franchise;
    }

    /**
     * Verify if a domain is registered and active (for Caddy On-Demand TLS)
     */
    async verifyDomainForCaddy(domain: string) {
        // Find if the domain matches any active franchise or our main platform domains
        // Hardcode main domains to avoid locking ourselves out during testing
        const mainDomains = [
            'localhost',
            'api.technosquareacademy.com',
            'technosquareacademy.com',
            'www.technosquareacademy.com',
            'mockaipro.com' // Keeping the user's test domain safe explicitly just in case
        ];

        if (mainDomains.includes(domain)) {
            return true;
        }

        const franchise = await this.prisma.franchise.findFirst({
            where: {
                domain: domain,
                is_active: true,
            },
            select: { id: true }
        });

        // Caddy considers any non-2xx status code as a strict rejection
        if (!franchise) {
            throw new ForbiddenException(`Domain ${domain} is not registered or active`);
        }

        return true;
    }

    /**
     * Get settings for the currently authenticated user's franchise
     */
    async getMySettings(franchiseId: string | null) {
        if (!franchiseId) {
            // Return default for system admins, or find the localhost franchise
            const systemFranchise = await this.prisma.franchise.findFirst({
                where: { domain: 'localhost' }
            });

            if (systemFranchise) {
                return systemFranchise;
            }

            return {
                id: null,
                name: 'AI Shiksha',
                lms_name: 'AI Shiksha',
                domain: 'localhost',
                logo_url: null,
                favicon_url: null,
                primary_color: '#6366f1',
                support_email: 'support@aishiksha.com',
                description: 'AI-powered learning management system.',
                is_active: true,
                domain_verified: true,
                maintenance_mode: false,
                seo_title: null,
                seo_description: null,
                seo_keywords: null,
            };
        }

        const franchise = await this.prisma.franchise.findUnique({
            where: { id: franchiseId },
        });

        if (!franchise) {
            throw new NotFoundException('Franchise not found');
        }

        return franchise;
    }

    /**
     * Update settings for the currently authenticated user's franchise 
     */
    async updateMySettings(franchiseId: string | null, dto: UpdateFranchiseDto) {
        if (!franchiseId) {
            // SUPER_ADMIN attempting to update system settings without a franchise model
            // Let's find or create a franchise for 'localhost'
            let systemFranchise = await this.prisma.franchise.findFirst({
                where: { domain: 'localhost' }
            });

            if (!systemFranchise) {
                systemFranchise = await this.prisma.franchise.create({
                    data: {
                        name: dto.name || 'AI Shiksha',
                        domain: 'localhost',
                        is_active: true,
                        domain_verified: true,
                    }
                });

                // Auto-generate default certificates for system franchise
                await this.generateDefaultCertificates(systemFranchise.id, this.prisma);
            }

            return this.prisma.franchise.update({
                where: { id: systemFranchise.id },
                data: dto,
            });
        }

        if (dto.domain) {
            const existing = await this.prisma.franchise.findFirst({
                where: { domain: dto.domain, NOT: { id: franchiseId } },
            });
            if (existing) {
                throw new ConflictException(`Domain "${dto.domain}" is already taken`);
            }
        }

        return this.prisma.franchise.update({
            where: { id: franchiseId },
            data: dto,
        });
    }

    /**
     * Create a new franchise and auto-create its FRANCHISE_ADMIN user
     */
    async create(dto: CreateFranchiseDto) {
        // Check domain uniqueness
        const existing = await this.prisma.franchise.findUnique({
            where: { domain: dto.domain },
        });
        if (existing) {
            throw new ConflictException(`Domain "${dto.domain}" is already registered`);
        }

        // Check admin email uniqueness
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.admin_email },
        });
        if (existingUser) {
            throw new ConflictException(`User with email "${dto.admin_email}" already exists`);
        }

        // Generate a temporary password for the franchise admin
        const tempPassword = this.generateTempPassword();
        const passwordHash = await bcrypt.hash(tempPassword, 10);

        // Create franchise and admin user in a transaction
        const result = await this.prisma.$transaction(async (tx) => {
            // Create franchise
            const franchise = await tx.franchise.create({
                data: {
                    name: dto.name,
                    lms_name: dto.lms_name,
                    domain: dto.domain,
                    logo_url: dto.logo_url,
                    primary_color: dto.primary_color || '#6366f1',
                    support_email: dto.support_email,
                    is_active: true,
                    domain_verified: false,
                },
            });

            // Auto-generate default certificates
            await this.generateDefaultCertificates(franchise.id, tx as any);

            // Create franchise admin user
            const adminUser = await tx.user.create({
                data: {
                    name: dto.admin_name,
                    email: dto.admin_email,
                    password_hash: passwordHash,
                    role: 'FRANCHISE_ADMIN',
                    franchise_id: franchise.id,
                },
            });

            return { franchise, adminUser, tempPassword };
        });

        return {
            franchise: result.franchise,
            admin: {
                id: result.adminUser.id,
                name: result.adminUser.name,
                email: result.adminUser.email,
                role: result.adminUser.role,
                temp_password: result.tempPassword,
                message: 'Franchise admin created. Please share the temporary password securely.',
            },
        };
    }

    /**
     * Update franchise details
     */
    async update(id: string, dto: UpdateFranchiseDto) {
        await this.findOne(id); // ensure exists

        if (dto.domain) {
            const existing = await this.prisma.franchise.findFirst({
                where: { domain: dto.domain, NOT: { id } },
            });
            if (existing) {
                throw new ConflictException(`Domain "${dto.domain}" is already taken`);
            }
        }

        return this.prisma.franchise.update({
            where: { id },
            data: dto,
        });
    }

    /**
     * Toggle franchise active status (suspend/activate)
     */
    async toggleSuspend(id: string) {
        const franchise = await this.findOne(id);
        return this.prisma.franchise.update({
            where: { id },
            data: { is_active: !franchise.is_active },
        });
    }

    /**
     * Get stats for a specific franchise (SUPER_ADMIN)
     */
    async getStats(id: string) {
        await this.findOne(id);

        const [userCount, courseCount, enrollmentCount, revenue] = await Promise.all([
            this.prisma.user.count({ where: { franchise_id: id } }),
            this.prisma.course.count({ where: { franchise_id: id } }),
            this.prisma.enrollment.count({ where: { franchise_id: id } }),
            this.prisma.payment.aggregate({
                where: { franchise_id: id, payment_status: 'completed' },
                _sum: { amount: true },
            }),
        ]);

        return {
            users: userCount,
            courses: courseCount,
            enrollments: enrollmentCount,
            revenue: revenue._sum.amount || 0,
        };
    }

    private generateTempPassword(): string {
        const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

    private async generateDefaultCertificates(franchise_id: string, txClient: any) {
        const modernTemplate = {
            name: 'Modern Minimalist',
            description: 'Clean, contemporary design with geometric elements',
            is_default: true,
            franchise_id,
            template_config: {
                canvas: {
                    width: 1122,
                    height: 793,
                    backgroundColor: '#FFFFFF',
                },
                elements: [
                    {
                        id: 'title',
                        type: 'text',
                        x: 100,
                        y: 120,
                        content: 'CERTIFICATE',
                        style: {
                            fontFamily: 'Inter, sans-serif',
                            fontSize: 42,
                            fontWeight: 'bold',
                            color: '#0891B2',
                            textAlign: 'left',
                            letterSpacing: 4,
                            textTransform: 'uppercase',
                        },
                    },
                    {
                        id: 'subtitle',
                        type: 'text',
                        x: 100,
                        y: 170,
                        content: 'OF COMPLETION',
                        style: {
                            fontFamily: 'Inter, sans-serif',
                            fontSize: 24,
                            fontWeight: 'normal',
                            color: '#475569',
                            textAlign: 'left',
                            letterSpacing: 2,
                        },
                    },
                    {
                        id: 'student-name',
                        type: 'variable',
                        x: 100,
                        y: 320,
                        content: '{student_name}',
                        style: {
                            fontFamily: 'Inter, sans-serif',
                            fontSize: 48,
                            fontWeight: 'bold',
                            color: '#0F172A',
                            textAlign: 'left',
                        },
                    },
                    {
                        id: 'course-name',
                        type: 'variable',
                        x: 100,
                        y: 450,
                        content: '{course_name}',
                        style: {
                            fontFamily: 'Inter, sans-serif',
                            fontSize: 28,
                            fontWeight: '600',
                            color: '#1E293B',
                            textAlign: 'left',
                        },
                    },
                    {
                        id: 'completion-date-label',
                        type: 'variable',
                        x: 100,
                        y: 650,
                        content: 'Completed on {completion_date}',
                        style: {
                            fontFamily: 'Inter, sans-serif',
                            fontSize: 14,
                            color: '#64748B',
                            textAlign: 'left',
                        },
                    },
                    {
                        id: 'instructor-label',
                        type: 'variable',
                        x: 100,
                        y: 680,
                        content: 'Instructor: {instructor_name}',
                        style: {
                            fontFamily: 'Inter, sans-serif',
                            fontSize: 14,
                            color: '#64748B',
                            textAlign: 'left',
                        },
                    },
                    {
                        id: 'qr-code',
                        type: 'qrcode',
                        x: 950,
                        y: 400,
                        width: 140,
                        height: 140,
                        content: '{qr_validation_url}',
                        style: {
                            opacity: 1,
                        },
                    },
                ],
            },
        };

        const corporateTemplate = {
            name: 'Corporate Professional',
            description: 'Professional business-style certificate',
            is_default: false,
            franchise_id,
            template_config: {
                canvas: {
                    width: 1122,
                    height: 793,
                    backgroundColor: '#F8FAFC',
                },
                elements: [
                    {
                        id: 'title',
                        type: 'text',
                        x: 561,
                        y: 100,
                        content: 'CERTIFICATE OF COMPLETION',
                        style: {
                            fontFamily: 'Roboto, sans-serif',
                            fontSize: 36,
                            fontWeight: 'bold',
                            color: '#1E40AF',
                            textAlign: 'center',
                            letterSpacing: 3,
                        },
                    },
                    {
                        id: 'student-name',
                        type: 'variable',
                        x: 561,
                        y: 340,
                        content: '{student_name}',
                        style: {
                            fontFamily: 'Roboto, sans-serif',
                            fontSize: 48,
                            fontWeight: 'bold',
                            color: '#1E40AF',
                            textAlign: 'center',
                        },
                    },
                    {
                        id: 'course-name',
                        type: 'variable',
                        x: 561,
                        y: 480,
                        content: '{course_name}',
                        style: {
                            fontFamily: 'Roboto, sans-serif',
                            fontSize: 30,
                            fontWeight: '600',
                            color: '#0F172A',
                            textAlign: 'center',
                        },
                    },
                    {
                        id: 'completion-date',
                        type: 'variable',
                        x: 300,
                        y: 620,
                        content: '{completion_date}',
                        style: {
                            fontFamily: 'Roboto, sans-serif',
                            fontSize: 14,
                            color: '#475569',
                            textAlign: 'center',
                        },
                    },
                    {
                        id: 'instructor-name',
                        type: 'variable',
                        x: 561,
                        y: 620,
                        content: '{instructor_name}',
                        style: {
                            fontFamily: 'Roboto, sans-serif',
                            fontSize: 14,
                            fontWeight: '600',
                            color: '#475569',
                            textAlign: 'center',
                        },
                    },
                ],
            },
        };

        await txClient.certificateTemplate.createMany({
            data: [modernTemplate, corporateTemplate],
        });
    }
}
