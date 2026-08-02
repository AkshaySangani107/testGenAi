import OpenAI from 'openai';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BaseAiProvider } from './base-ai.provider';
import { AiGenerateOptions, InternalAiResponse } from '../interfaces/ai-provider.interface';

export class OpenAIProvider extends BaseAiProvider {
  providerName = 'OpenAI';
  private client: OpenAI;

  constructor(apiKey: string, eventEmitter: EventEmitter2) {
    super(eventEmitter);
    this.client = new OpenAI({ apiKey });
  }

  protected async doGenerate(prompt: string, options?: AiGenerateOptions): Promise<InternalAiResponse> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-5-mini', // Kept from user request context
      messages: [{ role: 'user', content: prompt }],
      temperature: options?.temperature,
      stream: false,
    });

    return {
      content: response.choices[0].message.content || '',
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens || 0,
        totalTokens: response.usage.total_tokens
      } : undefined,
      costEstimate: response.usage ? (response.usage.prompt_tokens * 0.00015 + (response.usage.completion_tokens || 0) * 0.0006) / 1000 : 0
    };
  }

  protected async doEmbed(text: string): Promise<{ vector: number[]; usage?: any }> {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      dimensions: 768,
    });

    return {
      vector: response.data[0].embedding,
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: 0,
        totalTokens: response.usage.total_tokens
      } : undefined
    };
  }
}
