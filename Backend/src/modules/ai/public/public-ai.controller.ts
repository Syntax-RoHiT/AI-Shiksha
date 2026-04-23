import { Controller, Post, Body, Req, HttpException, HttpStatus, Get } from '@nestjs/common';
import type { Request } from 'express';
import { PublicAiService } from './public-ai.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Public AI')
@Controller('ai/public')
export class PublicAiController {
    constructor(private readonly publicAiService: PublicAiService) { }

    @Get('status')
    @ApiOperation({ summary: 'Check if public AI is enabled for the franchise' })
    async checkStatus(@Req() req: Request) {
        // tenantId injected by tenant middleware, fallback to branding ID for localhost
        const tenantId = (req as any).tenantId || (req as any).tenantBranding?.id || null;

        try {
            // just evaluate settings
            await this.publicAiService.evaluateGlobalAi(tenantId);
            return { enabled: true };
        } catch (error) {
            return { enabled: false, reason: error.message };
        }
    }

    @Post('chat')
    @ApiOperation({ summary: 'Engage in a public chat with the Sentinel AI' })
    @ApiResponse({ status: 201, description: 'AI response generated successfully.' })
    async chat(@Req() req: Request, @Body('message') message: string) {
        if (!message) {
            throw new HttpException('Message is required', HttpStatus.BAD_REQUEST);
        }

        const tenantId = (req as any).tenantId || (req as any).tenantBranding?.id || null;

        // Simplistic IP extraction (might need adjustment based on reverse proxy)
        const ip = req.ip || req.socket.remoteAddress || 'unknown';

        return this.publicAiService.publicChat(tenantId, ip, message);
    }
}
