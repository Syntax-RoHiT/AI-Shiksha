import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { GeminiService } from '../shared/gemini.service';
import { RateLimitService } from '../assistant/rate-limit.service'; // Assuming public uses same rate limit technique or a specialized one

@Injectable()
export class PublicAiService {
    private readonly logger = new Logger(PublicAiService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly geminiService: GeminiService,
        private readonly rateLimitService: RateLimitService,
    ) { }

    async evaluateGlobalAi(franchiseId: string | null) {
        if (!franchiseId) {
            // System domain fallback
            if (process.env.GEMINI_API_KEY) {
                return process.env.GEMINI_API_KEY;
            } else {
                // Fallback to first franchise if env var not set
                const firstFranchise = await this.prisma.franchise.findFirst({ select: { gemini_api_key: true } as any }) as any;
                if (firstFranchise?.gemini_api_key) return firstFranchise.gemini_api_key;
                
                throw new HttpException('Ask the Admin to Configure Gemini Key', HttpStatus.NOT_IMPLEMENTED);
            }
        }

        const franchise = await this.prisma.franchise.findUnique({
            where: { id: franchiseId },
            select: { global_ai_control: true, gemini_api_key: true } as any
        }) as any;

        if (!franchise) {
            throw new HttpException('Franchise not found', HttpStatus.NOT_FOUND);
        }

        if (franchise.global_ai_control === false) {
            throw new HttpException('AI Features are currently disabled globally.', HttpStatus.FORBIDDEN);
        }

        if (!franchise.gemini_api_key) {
            throw new HttpException('Ask the Admin to Configure Gemini Key', HttpStatus.NOT_IMPLEMENTED);
        }

        return franchise.gemini_api_key as string;
    }

    async publicChat(franchiseId: string | null, ipAddress: string, message: string) {
        // Basic IP-based rate limiting
        this.rateLimitService.checkRateLimit(`ip-${ipAddress}`);

        const customApiKey = await this.evaluateGlobalAi(franchiseId);

        try {
            // Very basic prompt for public chatbot
            const prompt = `You are an AI assistant for a Learning Management System (LMS). Be helpful, concise, and polite. 
User: ${message}
Agent:`;

            const responseText = await this.geminiService.generateText(prompt, customApiKey);

            return {
                status: 'success',
                data: {
                    response: responseText
                }
            };

        } catch (error) {
            this.logger.error(`Public AI Chat Error: ${error.message}`, error.stack);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'The AI service is temporarily unavailable. Please try again.',
                HttpStatus.SERVICE_UNAVAILABLE
            );
        }
    }
}
