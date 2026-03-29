import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { ChatDto } from './dto/chat.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Chat with AI Assistant' })
  chat(@Request() req, @Body() chatDto: ChatDto) {
    return this.aiService.chat(req.user.userId, chatDto);
  }

  @Post('index-lesson/:lessonId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manually index lesson content for AI' })
  indexLesson(@Param('lessonId') lessonId: string) {
    return this.aiService.indexLesson(lessonId);
  }
}
