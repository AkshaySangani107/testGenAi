import { EventEmitter2 } from '@nestjs/event-emitter';
import { BaseAiProvider } from './base-ai.provider';
import { GeminiProvider } from './gemini.provider';
import {
  AiGenerateOptions,
  InternalAiResponse,
} from '../interfaces/ai-provider.interface';

export class CustomModelProvider extends BaseAiProvider {
  providerName = 'TestGenAI Fine-Tuned Model (Qwen2.5-Coder-7B)';
  private readonly baseUrl: string;
  private readonly geminiEmbeddingProvider?: GeminiProvider;

  constructor(
    baseUrl: string,
    geminiApiKey: string | undefined,
    eventEmitter: EventEmitter2,
  ) {
    super(eventEmitter);
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    if (geminiApiKey) {
      this.geminiEmbeddingProvider = new GeminiProvider(
        geminiApiKey,
        eventEmitter,
      );
    }
  }

  protected async doGenerate(
    prompt: string,
    options?: AiGenerateOptions,
  ): Promise<InternalAiResponse> {
    const res = await fetch(`${this.baseUrl}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        max_tokens: 1536,
        temperature: options?.temperature ?? 0.2,
      }),
    });

    if (!res.ok) {
      throw new Error(
        `Custom Model API error: ${res.status} ${res.statusText}`,
      );
    }

    const data = (await res.json()) as { content?: string };
    const content = data.content || '';

    const promptTokens = Math.ceil(prompt.length / 4);
    const completionTokens = Math.ceil(content.length / 4);

    return {
      content,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
      costEstimate: 0,
    };
  }

  protected async doEmbed(
    text: string,
  ): Promise<{ vector: number[]; usage?: unknown }> {
    if (this.geminiEmbeddingProvider) {
      return this.geminiEmbeddingProvider.embed(text);
    }
    return { vector: [] };
  }
}
