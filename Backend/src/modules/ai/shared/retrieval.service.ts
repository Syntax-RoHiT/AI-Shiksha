import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { EmbeddingService } from './embedding.service';

@Injectable()
export class RetrievalService {
  private readonly logger = new Logger(RetrievalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  /**
   * Retrieves the top 5 most relevant content chunks for a given query within a course.
   */
  async retrieveRelevantChunks(courseId: string, query: string, customApiKey?: string): Promise<string[]> {
    if (!query || !query.trim()) return [];

    // 1. Generate Embedding for the query
    const embedding = await this.embeddingService.generateEmbedding(query, customApiKey);
    
    // If embedding API fails, return empty array (fallback to no context)
    // We cannot do semantic search without a query vector.
    if (!embedding) {
      this.logger.warn('Skipping retrieval: Failed to generate query embedding');
      return [];
    }

    // 2. Format as string for pgvector: '[0.1,0.2,...]'
    const vectorString = `[${embedding.join(',')}]`;

    try {
      // 3. Execute Vector Search
      // We use raw SQL because Prisma does not support vector operators natively yet in typed queries
      const results = await this.prisma.$queryRaw<Array<{ content_chunk: string }>>`
        SELECT content_chunk
        FROM "lesson_embeddings"
        WHERE lesson_id IN (
            SELECT l.id 
            FROM "lessons" l
            INNER JOIN "modules" m ON l.module_id = m.id
            WHERE m.course_id = ${courseId}
        )
        ORDER BY embedding <=> ${vectorString}::vector
        LIMIT 5;
      `;

      return results.map((r) => r.content_chunk);
    } catch (error) {
      this.logger.error(`Vector Retrieval Failed: ${error.message}`);
      return [];
    }
  }
}
