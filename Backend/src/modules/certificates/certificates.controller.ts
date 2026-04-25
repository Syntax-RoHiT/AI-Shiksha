import { Controller, Get, Param, Request, UseGuards, NotFoundException, Res, Header } from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';

@ApiTags('Certificates')
@Controller('certificates')
export class CertificatesController {
    constructor(private readonly certificatesService: CertificatesService) { }

    @Get()
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get my certificates' })
    @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    @Header('Pragma', 'no-cache')
    @Header('Expires', '0')
    async getMyCertificates(@Request() req) {
        return this.certificatesService.getMyCertificates(req.user.userId, req.user.franchise_id);
    }

    @Get(':id')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get certificate by ID' })
    getCertificateById(@Param('id') id: string, @Request() req) {
        const userId = req.user?.id || 1; // Fallback seems odd, but keeping existing logic structure
        // Actually req.user.userId is what we use elsewhere. req.user.id might be undefined if not standardized.
        // auth.service usually returns payload with userId.
        // Let's stick to req.user.userId if that's what other controllers use.
        // Checked other controllers: req.user.userId.
        // But here it says `req.user?.id || 1`. I should probably fix this to be safe or consistent.
        // "1" is definitely wrong in production.
        // detailed log inspection says "req.user.userId" in other controllers.
        // I will use req.user.userId.
        const effectiveUserId = req.user.userId;
        return this.certificatesService.getCertificateById(id, effectiveUserId, req.user.franchise_id);
    }

    @Get('course/:courseId/download')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Download certificate by Course ID' })
    async downloadCertificateByCourse(
        @Param('courseId') courseId: string,
        @Request() req,
        @Res() res,
    ) {
        const userId = req.user.userId;
        try {
            await this.certificatesService.downloadCertificateByCourse(courseId, userId, res, req.user.franchise_id);
        } catch (error) {
            console.error('Error generating certificate by course:', error);
            if (!res.headersSent) {
                return res.status(500).send(error.message || 'Failed to generate certificate');
            }
        }
    }

    @Get(':id/download')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Download certificate PDF' })
    async downloadCertificate(
        @Param('id') id: string,
        @Request() req,
        @Res() res,
    ) {
        const userId = req.user.userId;
        try {
            await this.certificatesService.downloadCertificate(id, userId, res, req.user.franchise_id);
        } catch (error) {
            console.error('Error generating certificate by id:', error);
            if (!res.headersSent) {
                return res.status(500).send(error.message || 'Failed to generate certificate');
            }
        }
    }

    @Get('validate/:userId/:courseSlug')
    @ApiOperation({ summary: 'Validate certificate via QR code (public endpoint)' })
    async validateCertificate(
        @Param('userId') userId: string,
        @Param('courseSlug') courseSlug: string,
        @Request() req,
    ) {
        const franchiseId = (req as any).tenantId; // From TenantMiddleware
        const result = await this.certificatesService.validateCertificate(userId, courseSlug, franchiseId);

        if (!result) {
            console.warn(`[CertificatesController.validate] Certificate not found`);
            throw new NotFoundException('Certificate not found or invalid');
        }

        return result;
    }
}

