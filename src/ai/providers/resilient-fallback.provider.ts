import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BaseAiProvider } from './base-ai.provider';
import { GeminiProvider } from './gemini.provider';
import { GroqProvider } from './groq.provider';
import {
  AiGenerateOptions,
  InternalAiResponse,
} from '../interfaces/ai-provider.interface';

/**
 * Resilient Multi-Key & Fallback AI Provider
 *
 * Capabilities:
 * 1. Supports comma-separated keys for Gemini (GEMINI_API_KEYS=k1,k2,k3 or GEMINI_API_KEY)
 * 2. On 429 (ResourceExhausted / Rate Limit), automatically rotates to the next available Gemini key
 * 3. If all Gemini keys hit 429, automatically fails over to Groq free-tier provider
 * 4. Ensures ₹0 operations without job aborts
 */
export class ResilientFallbackProvider extends BaseAiProvider {
  providerName = 'ResilientPool (Gemini Pool + Groq Fallback)';
  protected readonly logger = new Logger(ResilientFallbackProvider.name);

  private geminiProviders: GeminiProvider[] = [];
  private currentGeminiIndex = 0;
  private fallbackGroqProvider: GroqProvider | null = null;

  constructor(
    geminiKeysInput: string,
    groqApiKey: string | undefined,
    eventEmitter: EventEmitter2,
  ) {
    super(eventEmitter);

    // Parse comma-separated keys
    const keys = geminiKeysInput
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    for (const key of keys) {
      this.geminiProviders.push(new GeminiProvider(key, eventEmitter));
    }

    if (groqApiKey && keys.length > 0) {
      this.fallbackGroqProvider = new GroqProvider(
        groqApiKey,
        keys[0],
        eventEmitter,
      );
    }

    this.logger.log(
      `Initialized ResilientFallbackProvider with ${this.geminiProviders.length} Gemini key(s) and ${
        this.fallbackGroqProvider ? '1 Groq fallback' : 'no fallback'
      }`,
    );
  }

  private isRateLimitError(err: unknown): boolean {
    if (!err || typeof err !== 'object') return false;
    const rec = err as Record<string, unknown>;
    const status =
      typeof rec.status === 'number'
        ? rec.status
        : typeof rec.code === 'number'
          ? rec.code
          : 0;
    const msg =
      err instanceof Error
        ? err.message.toLowerCase()
        : typeof rec.message === 'string'
          ? rec.message.toLowerCase()
          : '';

    return (
      status === 429 ||
      msg.includes('resource_exhausted') ||
      msg.includes('quota') ||
      msg.includes('rate limit')
    );
  }

  protected async doGenerate(
    prompt: string,
    options?: AiGenerateOptions,
  ): Promise<InternalAiResponse> {
    let lastError: Error | null = null;

    // Step 1: Try all Gemini keys sequentially
    const geminiAttempts = this.geminiProviders.length;

    for (let i = 0; i < geminiAttempts; i++) {
      const providerIndex =
        (this.currentGeminiIndex + i) % this.geminiProviders.length;
      const provider = this.geminiProviders[providerIndex];

      try {
        const response = await provider.generate(prompt, options);
        // Set active index to the successful provider
        this.currentGeminiIndex = providerIndex;
        return response;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (this.isRateLimitError(err)) {
          this.logger.warn(
            `Gemini Key #${providerIndex + 1} hit rate limit / 429. Rotating to next available key...`,
          );
          continue;
        }
        // If it's a syntax or unrecoverable error, rethrow guaranteed Error
        throw lastError;
      }
    }

    // Step 2: If all Gemini keys exhausted, fall back to Groq
    if (this.fallbackGroqProvider) {
      this.logger.warn(
        'All Gemini keys exhausted 429 quota. Falling back to Groq free-tier provider...',
      );
      try {
        const response = await this.fallbackGroqProvider.generate(
          prompt,
          options,
        );
        this.logger.log(
          '✅ Successfully completed generation using Groq fallback provider',
        );
        return response;
      } catch (groqErr: unknown) {
        this.logger.error('Groq fallback also failed or hit limits');
        throw groqErr instanceof Error ? groqErr : new Error(String(groqErr));
      }
    }

    throw lastError || new Error('All AI providers exhausted.');
  }

  protected async doEmbed(
    text: string,
  ): Promise<{ vector: number[]; usage?: unknown }> {
    // Embeddings use the first active Gemini provider
    if (this.geminiProviders.length > 0) {
      return await this.geminiProviders[this.currentGeminiIndex].embed(text);
    }
    throw new Error('No Gemini provider available for embedding.');
  }
}
