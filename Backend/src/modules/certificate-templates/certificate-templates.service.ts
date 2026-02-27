import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCertificateTemplateDto } from './dto/create-certificate-template.dto';
import { UpdateCertificateTemplateDto } from './dto/update-certificate-template.dto';

@Injectable()
export class CertificateTemplatesService {
    constructor(private prisma: PrismaService) { }

    async findAll(franchiseId: string) {
        return this.prisma.certificateTemplate.findMany({
            where: { franchise_id: franchiseId },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                _count: {
                    select: {
                        courses: true,
                    },
                },
            },
            orderBy: [
                { is_default: 'desc' },
                { created_at: 'desc' },
            ],
        });
    }

    async findOne(id: string, franchiseId: string) {
        const template = await this.prisma.certificateTemplate.findFirst({
            where: { id, franchise_id: franchiseId },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                courses: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });

        if (!template) {
            throw new NotFoundException('Certificate template not found');
        }

        return template;
    }

    async getDefault(franchiseId: string) {
        const defaultTemplate = await this.prisma.certificateTemplate.findFirst({
            where: { is_default: true, franchise_id: franchiseId },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!defaultTemplate) {
            // Return a basic template if no default is set
            return {
                id: 'default',
                name: 'Default Certificate',
                description: 'Basic certificate template',
                is_default: true,
                template_config: {
                    layout: 'classic',
                    background_color: '#ffffff',
                    border_style: 'double',
                    border_color: '#000000',
                    title_text: 'Certificate of Completion',
                    title_font: 'Georgia',
                    title_color: '#1a1a1a',
                    body_font: 'Arial',
                    body_color: '#333333',
                },
                created_at: new Date(),
                updated_at: new Date(),
            };
        }

        return defaultTemplate;
    }

    async create(dto: CreateCertificateTemplateDto, userId: string, franchiseId: string) {
        // If this is set as default, unset all other defaults for this franchise
        if (dto.is_default) {
            await this.prisma.certificateTemplate.updateMany({
                where: { is_default: true, franchise_id: franchiseId },
                data: { is_default: false },
            });
        }

        return this.prisma.certificateTemplate.create({
            data: {
                name: dto.name,
                description: dto.description,
                template_config: dto.template_config as any,
                preview_image_url: dto.preview_image_url,
                is_default: dto.is_default || false,
                created_by: userId,
                franchise_id: franchiseId,
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }

    async update(id: string, dto: UpdateCertificateTemplateDto, franchiseId: string) {
        const template = await this.findOne(id, franchiseId);

        // If setting as default, unset all other defaults in this franchise
        if (dto.is_default) {
            await this.prisma.certificateTemplate.updateMany({
                where: {
                    id: { not: id },
                    is_default: true,
                    franchise_id: franchiseId
                },
                data: { is_default: false },
            });
        }

        return this.prisma.certificateTemplate.update({
            where: { id: template.id },
            data: {
                name: dto.name,
                description: dto.description,
                template_config: dto.template_config as any,
                preview_image_url: dto.preview_image_url,
                is_default: dto.is_default,
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }

    async delete(id: string, franchiseId: string) {
        const template = await this.findOne(id, franchiseId);

        // Check if template is in use
        const coursesUsingTemplate = await this.prisma.course.count({
            where: { certificate_template_id: id, franchise_id: franchiseId },
        });

        if (coursesUsingTemplate > 0) {
            throw new BadRequestException(
                `Cannot delete template: it is currently used by ${coursesUsingTemplate} course(s)`,
            );
        }

        await this.prisma.certificateTemplate.delete({
            where: { id: template.id },
        });

        return { message: 'Template deleted successfully' };
    }

    async setDefault(id: string, franchiseId: string) {
        const template = await this.findOne(id, franchiseId);

        // Unset all other defaults in this franchise
        await this.prisma.certificateTemplate.updateMany({
            where: {
                id: { not: id },
                is_default: true,
                franchise_id: franchiseId
            },
            data: { is_default: false },
        });

        // Set this template as default
        return this.prisma.certificateTemplate.update({
            where: { id: template.id },
            data: { is_default: true },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }
}
