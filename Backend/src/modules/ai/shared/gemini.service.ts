import { Injectable, InternalServerErrorException, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly client: AxiosInstance;
  private readonly apiKey: string;
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

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

  async generateText(prompt: string, customApiKey?: string): Promise<string> {
    const keyToUse = customApiKey || this.apiKey;

    if (!keyToUse) {
      throw new InternalServerErrorException('AI settings misconfigured');
    }

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 500,
      },
    };

    try {
      const response = await this.client.post(
        `${this.baseUrl}?key=${keyToUse}`,
        payload,
      );

      const candidates = response.data?.candidates;
      if (!candidates || candidates.length === 0) {
        this.logger.warn('Gemini returned no candidates');
        return 'I could not generate a response at this time.';
      }

      const content = candidates[0].content?.parts?.[0]?.text;
      if (!content) {
        this.logger.warn('Gemini returned empty content');
        return 'I could not generate a response at this time.';
      }

      return content;
    } catch (error) {
      // Hide raw error details from the user
      this.logger.error(
        `Gemini API Error: ${error.message}`,
        error.response?.data ? JSON.stringify(error.response.data) : (error.stack || ''),
      );

      // Check for strict timeouts or rate limits
      if (error.code === 'ECONNABORTED' || error.response?.status === 429 || error.response?.status >= 500) {
        throw new ServiceUnavailableException('The AI service is currently overloaded. Please try again later.');
      }

      throw new ServiceUnavailableException('The AI service is temporarily unavailable.');
    }
  }
}
