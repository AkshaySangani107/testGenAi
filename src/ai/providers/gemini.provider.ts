import { GoogleGenAI } from '@google/genai';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BaseAiProvider } from './base-ai.provider';
import { AiGenerateOptions, InternalAiResponse } from '../interfaces/ai-provider.interface';

export class GeminiProvider extends BaseAiProvider {
  providerName = 'Gemini';
  private client: GoogleGenAI;

  constructor(apiKey: string, eventEmitter: EventEmitter2) {
    super(eventEmitter);
    this.client = new GoogleGenAI({ apiKey });
  }

  protected async doGenerate(prompt: string, options?: AiGenerateOptions): Promise<InternalAiResponse> {
    const response = await this.client.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
    });
    
    // Note: Gemini token counts are retrieved differently depending on the SDK version.
    // For simplicity, we are returning the text.
    return {
      content: response.text || '',
    };
  }

  protected async doEmbed(text: string): Promise<{ vector: number[]; usage?: any }> {
    const response = await this.client.models.embedContent({
      model: 'gemini-embedding-001',
      contents: text,
    });
    
    return {
      vector: response.embeddings?.[0].values || []
    };
  }
}
