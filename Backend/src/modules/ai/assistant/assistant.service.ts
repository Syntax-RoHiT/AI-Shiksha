import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
  ServiceUnavailableException,
  Logger,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { GeminiService } from '../shared/gemini.service';
import { PromptBuilderService } from '../shared/prompt-builder.service';
import { RetrievalService } from '../shared/retrieval.service';
import { RateLimitService } from './rate-limit.service'; // Start of Rate Limit
import { ChatDto } from '../dto/chat.dto';

@Injectable()
export class AssistantService {
  private readonly logger = new Logger(AssistantService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
    private readonly promptBuilder: PromptBuilderService,
    private readonly retrievalService: RetrievalService,
    private readonly rateLimitService: RateLimitService,
  ) { }

  async chat(userId: string, tenantId: string | null, chatDto: ChatDto, requestDomain?: string | null, userRole?: string) {
    const start = Date.now();
    const { courseId, message } = chatDto;

    // 0. Rate Limiting (Check BEFORE heavy ops)
    // Throws 429 if exceeded
    this.rateLimitService.checkRateLimit(userId);

    try {
      let courseTitle = 'General Knowledge';
      let contextContent = '';
      let conversation;
      let chunks: string[] = [];

      let customApiKey: string | undefined = undefined;
      let userFranchiseId: string | null | undefined = null;

      // Step 1: user's own franchise_id from DB
      const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { franchise_id: true } });
      userFranchiseId = u?.franchise_id;

      // Step 2: fall back to the tenant resolved by the middleware from the request domain
      if (!userFranchiseId && tenantId) {
        userFranchiseId = tenantId;
      }

      // Step 3: domain-based lookup — handles accounts created before franchise_id was enforced
      if (!userFranchiseId && requestDomain) {
        const domainOnly = requestDomain.split(':')[0].toLowerCase().trim();
        const parts = domainOnly.split('.');
        const rootDomain = parts.length > 2 ? parts.slice(-2).join('.') : domainOnly;

        const franchiseByDomain = await this.prisma.franchise.findFirst({
          where: {
            OR: [
              { domain: domainOnly },
              { domain: rootDomain },
              { domain: { contains: rootDomain } } as any,
            ],
          } as any,
          select: { id: true } as any,
        }) as any;

        if (franchiseByDomain?.id) {
          userFranchiseId = franchiseByDomain.id;
        } else {
          // Step 4: last resort — find the franchise that has a Gemini key configured.
          // Applies to single-franchise deployments where the request domain isn't stored in the DB.
          const franchiseWithKey = await (this.prisma.franchise as any).findFirst({
            where: { gemini_api_key: { not: null } },
            select: { id: true },
          });
          if (franchiseWithKey?.id) {
            userFranchiseId = franchiseWithKey.id;
          }
        }
      }

      if (userFranchiseId) {
        const franchise = await this.prisma.franchise.findUnique({
          where: { id: userFranchiseId },
          select: {
            gemini_api_key: true,
            global_ai_control: true,
          } as any,
        }) as any;

        // Check if AI is globally disabled for this franchise
        if (franchise && franchise.global_ai_control === false) {
          throw new HttpException(
            'AI Assistant is currently disabled by the administrator.',
            HttpStatus.FORBIDDEN,
          );
        }

        if (!franchise?.gemini_api_key) {
          throw new HttpException(
            'AI is not configured for this platform. Please ask the Admin to set up the Gemini API key.',
            HttpStatus.NOT_IMPLEMENTED,
          );
        }
        customApiKey = franchise.gemini_api_key as string;
      } else {
        // No franchise context — check if a system-level key exists
        const systemKey = (this.geminiService as any)['apiKey'];
        if (!systemKey) {
          throw new HttpException(
            'AI is not configured for this platform. Please contact the administrator.',
            HttpStatus.NOT_IMPLEMENTED,
          );
        }
      }

      // 1. Course Specific Logic (if courseId provided)
      if (courseId) {
        // 1a. Validate Course & Get User's Franchise
        const course = await this.prisma.course.findUnique({
          where: { id: courseId },
          select: { title: true },
        });

        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { franchise_id: true }
        });

        if (!course) {
          throw new NotFoundException('Course not found');
        }
        courseTitle = course.title;

        // 1b. Validate Enrollment (Strict: must be active) - Bypass for Admins/Instructors
        const isAdminOrInstructor = ['ADMIN', 'SUPER_ADMIN', 'INSTRUCTOR'].includes(userRole?.toUpperCase() || '');
        
        if (!isAdminOrInstructor) {
          const enrollment = await this.prisma.enrollment.findUnique({
            where: {
              student_id_course_id: {
                student_id: userId,
                course_id: courseId,
              },
            },
            select: { status: true },
          });

          if (!enrollment || enrollment.status !== 'active') {
            throw new ForbiddenException(
              'You must have an active enrollment in this course to use the AI assistant.',
            );
          }
        }

        // 1c. Find/Create Course Conversation
        conversation = await this.prisma.aIConversation.findFirst({
          where: {
            user_id: userId,
            course_id: courseId,
          },
          orderBy: { updated_at: 'desc' },
        });

        if (!conversation) {
          conversation = await this.prisma.aIConversation.create({
            data: {
              user_id: userId,
              course_id: courseId,
            },
          });
        }

        // 1d. Retrieve Relevant Content (RAG) using Custom API Key
        chunks = await this.retrievalService.retrieveRelevantChunks(courseId, message, customApiKey);
        const fullContent = chunks.join('\n\n---\n\n');
        contextContent = fullContent.slice(0, 4000);

      } else {
        // 2. General Chat Logic (No Course)
        // Find/Create General Conversation (course_id is NULL)
        conversation = await this.prisma.aIConversation.findFirst({
          where: {
            user_id: userId,
            course_id: null,
          },
          orderBy: { updated_at: 'desc' },
        });

        if (!conversation) {
          conversation = await this.prisma.aIConversation.create({
            data: {
              user_id: userId,
              course_id: null,
            },
          });
        }
      }

      // 3. Save USER Message
      await this.prisma.aIMessage.create({
        data: {
          conversation_id: conversation.id,
          role: 'user',
          content: message,
        },
      });

      // 4. Fetch Last 5 Messages
      const recentMessages = await this.prisma.aIMessage.findMany({
        where: { conversation_id: conversation.id },
        orderBy: { created_at: 'desc' },
        take: 5,
        select: { role: true, content: true },
      });

      const history = recentMessages.reverse();

      // 5. Build Prompt
      // If contextContent is empty, the prompt builder should handle it as general chat
      const prompt = this.promptBuilder.buildPrompt(
        courseTitle,
        contextContent,
        history,
        message,
      );

      // 6. Call Gemini using custom API key
      const responseText = await this.geminiService.generateText(prompt, customApiKey);

      // 7. Save ASSISTANT Message
      await this.prisma.aIMessage.create({
        data: {
          conversation_id: conversation.id,
          role: 'assistant',
          content: responseText,
        },
      });

      // 8. Logging
      const latency = Date.now() - start;
      const inputEst = Math.ceil(prompt.length / 4);
      const outputEst = Math.ceil(responseText.length / 4);

      /*
      this.prisma.aIUsageLog.create({
        data: {
          user_id: userId,
          course_id: courseId || null,
          input_tokens_estimate: inputEst,
          output_tokens_estimate: outputEst,
          latency_ms: latency,
        }
      }).catch(err => {
        this.logger.error(`Failed to log AI usage: ${err.message}`);
      });
      */

      // 9. Return Response
      return {
        status: 'success',
        data: {
          response: responseText,
          debug: {
            courseTitle,
            retrievedChunks: chunks || [],
            generatedPrompt: prompt,
            usage: {
              inputEst,
              outputEst,
              latencyMs: latency
            }
          }
        },
      };

    } catch (error) {
      this.logger.error(`AI Chat Error: ${error.message}`, error.stack);

      // Pass through HTTP exceptions (404, 403, 429)
      if (error instanceof HttpException) {
        throw error;
      }

      // Mask all other errors (Gemini timeouts, DB errors)
      throw new ServiceUnavailableException(
        'The AI service is temporarily unavailable. Please try again.',
      );
    }
  }
}

