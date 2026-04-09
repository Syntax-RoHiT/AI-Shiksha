import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly client: AxiosInstance;
  private readonly apiKey: string;
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    
    if (!this.apiKey) {
      this.logger.log('No system-level GEMINI_API_KEY detected. Dynamic keys will be required.');
    }

    this.client = axios.create({
      timeout: 10000, // Strict 10s timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Generates a 768-dimensional vector embedding for the given text.
   * Returns null on failure to allow graceful degradation.
   */
  async generateEmbedding(text: string, customApiKey?: string): Promise<number[] | null> {
    const keyToUse = customApiKey || this.apiKey;
    if (!keyToUse) {
      this.logger.warn('Skipping embedding generation: API Key missing');
      return null;
    }
    if (!text || text.trim().length === 0) {
      return null;
    }

    try {
      const response = await this.client.post(
        `${this.baseUrl}?key=${keyToUse}`,
        {
          content: {
            parts: [{ text }],
          },
          outputDimensionality: 768
        },
      );

      const values = response.data?.embedding?.values;
      
      if (!values || !Array.isArray(values)) {
        this.logger.warn('Gemini returned invalid embedding format');
        return null;
      }

      return values;
    } catch (error) {
      // Log error but do not throw, to ensure main flow continues
      this.logger.error(
        `Embedding Generation Failed: ${error.message}`,
        error.response?.data ? JSON.stringify(error.response.data) : '',
      );
      return null;
    }
  }
}
