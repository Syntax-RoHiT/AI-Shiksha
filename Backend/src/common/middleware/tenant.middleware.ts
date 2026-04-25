import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * TenantMiddleware
 *
 * Reads req.hostname, looks up the matching franchise by domain,
 * and injects franchise_id into the request object.
 *
 * SUPER_ADMIN users bypass franchise restriction (handled in services).
 * If no franchise is found for the domain, franchise_id is set to null
 * (SUPER_ADMIN can still operate; others will be scoped to their JWT franchise_id).
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
    constructor(private prisma: PrismaService) { }

    async use(req: Request, res: Response, next: NextFunction) {
        // Check for custom header from frontend (managed in api.ts)
        const customDomain = (req.headers['x-franchise-domain'] as string) || (req.headers['custom-franchise-domain'] as string);

        const hostname = customDomain || req.hostname || (req.headers['host'] as string) || 'localhost';
        // Strip port number for local dev (e.g. "localhost:3000" → "localhost")
        const domain = hostname.split(':')[0];

        // Ensure we support production Master Domains natively without Database records
        let isSystemDomain = domain === 'localhost' || domain === '127.0.0.1';

        if (process.env.SYSTEM_DOMAINS) {
            const allowed = process.env.SYSTEM_DOMAINS.split(',').map(d => d.trim());
            if (allowed.includes(domain)) isSystemDomain = true;
        }
        if (process.env.FRONTEND_URL && process.env.FRONTEND_URL.includes(domain)) {
            isSystemDomain = true;
        }

        try {
            const franchise = await this.prisma.franchise.findFirst({
                where: {
                    OR: [{ domain }, { domain: hostname }],
                    is_active: true,
                },
                select: { id: true, name: true, lms_name: true, logo_url: true, primary_color: true },
            });

            if (franchise) {
                // We always attach the actual franchise ID, even for the system domain.
                (req as any).tenantId = franchise.id;
                (req as any).tenantBranding = franchise;
            } else {
                // If it's not localhost and no franchise is found, it's an invalid franchise domain.
                // We should block access rather than falling back to the system context.
                if (!isSystemDomain) {
                    throw new UnauthorizedException('Invalid Franchise Domain: ' + domain);
                }

                // Allow localhost to fallback to System for Super Admin login
                (req as any).tenantId = null;
                (req as any).tenantBranding = null;
            }
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            // If DB lookup fails, continue without tenant context
            (req as any).tenantId = null;
            (req as any).tenantBranding = null;
        }

        next();
    }
}
