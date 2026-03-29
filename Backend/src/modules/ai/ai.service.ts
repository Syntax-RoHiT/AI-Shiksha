import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ChatDto } from './dto/chat.dto';

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
  }

  async indexLesson(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });
    if (!lesson || !lesson.content) return;

    // Simple chunking for now. Assume content is string or JSON.
    // If JSON, stringify it.
    const text =
      typeof lesson.content === 'string'
        ? lesson.content
        : JSON.stringify(lesson.content);

    // Create chunks (simplified)
    const chunks = text.match(/.{1,1000}/g) || [];

    // Delete existing embeddings
    await this.prisma.lessonEmbedding.deleteMany({
      where: { lesson_id: lessonId },
    });

    for (const chunk of chunks) {
      // Mock embedding storage for SQLite
      // We store the chunk but embedding is disabled/dummy
      await this.prisma.lessonEmbedding.create({
        data: {
          lesson_id: lessonId,
          content_chunk: chunk,
          // embedding: "[]" // Removed: caused type error and is optional in schema
        },
      });
    }
  }

  async chat(userId: string, chatDto: ChatDto) {
    const { message, courseId, lessonId } = chatDto;

    // 1. Get embedding for query (Skipped for SQLite)
    // const queryEmbedding = await this.getEmbedding(message);

    // 2. Search similar context (Mocked for SQLite)
    let context = '';

    // Simplified context retrieval without vectors
    if (lessonId) {
      const results = await this.prisma.lessonEmbedding.findMany({
        where: { lesson_id: lessonId },
        take: 3,
      });
      context = results.map((r) => r.content_chunk).join('\n');
    } else if (courseId) {
      // Join with lessons to filter by course
      // SQLite doesn't support advanced joins in Prisma nicely without relation traversal,
      // but we can do it via findMany on LessonEmbedding if we had relations,
      // but LessonEmbedding relates to Lesson which relates to Module which relates to Course.
      // Let's just do a rough query
      const lessons = await this.prisma.lesson.findMany({
        where: { module: { course_id: courseId } },
        select: { id: true },
      });
      const lessonIds = lessons.map((l) => l.id);

      const results = await this.prisma.lessonEmbedding.findMany({
        where: { lesson_id: { in: lessonIds } },
        take: 3,
      });
      context = results.map((r) => r.content_chunk).join('\n');
    }

    // 3. Create Conversation Entry
    const conversation = await this.prisma.aIConversation.create({
      data: {
        user_id: userId,
        course_id: courseId,
        lesson_id: lessonId,
      },
    });

    // 4. Send to LLM
    let response =
      "I'm sorry, AI features are currently limited in offline mode.";
    try {
      const completion = await this.openai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a helpful AI tutor. Use the following context to answer the student's question:\n\n${context}`,
          },
          { role: 'user', content: message },
        ],
        model: 'gpt-3.5-turbo',
      });

      response =
        completion.choices[0].message.content ||
        'Sorry, I could not generate a response.';
    } catch (e) {
      console.warn('OpenAI call failed or skipped', e);
    }

    // 5. Save Messages
    await this.prisma.aIMessage.createMany({
      data: [
        { conversation_id: conversation.id, role: 'user', content: message },
        {
          conversation_id: conversation.id,
          role: 'assistant',
          content: response,
        },
      ],
    });

    return { response, conversationId: conversation.id };
  }

  private async getEmbedding(text: string) {
    // Disabled for SQLite
    return [];
  }
}
