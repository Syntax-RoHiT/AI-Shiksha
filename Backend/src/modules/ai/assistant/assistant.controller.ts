import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AssistantService } from './assistant.service';
import { ChatDto } from '../dto/chat.dto';

@ApiTags('AI Assistant')
@Controller('ai/assistant')
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) { }

  @Post('chat')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Chat with the AI Assistant for a specific course' })
  @ApiResponse({ status: 201, description: 'AI response generated successfully.' })
  @ApiResponse({ status: 403, description: 'User not enrolled in the course.' })
  chat(@Request() req, @Body() chatDto: ChatDto) {
    // tenantId priority: middleware domain lookup → branding id → JWT franchise claim
    const tenantId = req.tenantId || req.tenantBranding?.id || req.user?.franchise_id || null;
    // Raw domain header for last-resort franchise lookup in the service
    const requestDomain = (req.headers['custom-franchise-domain'] as string)
      || (req.headers['x-franchise-domain'] as string)
      || req.hostname
      || null;
    return this.assistantService.chat(req.user.userId, tenantId, chatDto, requestDomain);
  }
}
