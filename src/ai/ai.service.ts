import { Injectable, Inject, Logger } from '@nestjs/common';
import type { AiGenerateOptions, AiProvider } from './interfaces/ai-provider.interface';
import { AI_PROVIDER_STRATEGY_TOKEN } from './providers/ai-provider.factory';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    @Inject(AI_PROVIDER_STRATEGY_TOKEN) private readonly strategy: AiProvider
  ) {
    this.logger.log(`Initialized AiService with strategy: ${this.strategy.providerName}`);
  }

  /**
   * Generates text using the configured AI strategy.
   * If streaming is configured via options, an AsyncGenerator is returned.
   */
  async generate(prompt: string, options?: AiGenerateOptions): Promise<string | AsyncGenerator<string>> {
    const response = await this.strategy.generate(prompt, options);
    return response.content;
  }

  /**
   * Generates a numeric vector embedding.
   */
  async embed(text: string): Promise<number[]> {
    const response = await this.strategy.embed(text);
    return response.vector;
  }
}
