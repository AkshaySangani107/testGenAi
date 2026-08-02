import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AiProvider, AiGenerateOptions, InternalAiResponse } from '../interfaces/ai-provider.interface';
import { withResilience } from '../resilience/resilience.wrapper';

export abstract class BaseAiProvider implements AiProvider {
  protected readonly logger = new Logger(this.constructor.name);
  abstract providerName: string;

  constructor(protected readonly eventEmitter: EventEmitter2) {}

  protected abstract doGenerate(prompt: string, options?: AiGenerateOptions): Promise<InternalAiResponse>;
  protected abstract doEmbed(text: string): Promise<{ vector: number[]; usage?: any }>;

  async generate(prompt: string, options?: AiGenerateOptions): Promise<InternalAiResponse> {
    const response = await withResilience(
      () => this.doGenerate(prompt, options),
      this.logger,
      this.providerName
    );

    // Emit metrics event asynchronously for token & cost tracking
    if (response.usage) {
      this.eventEmitter.emit('ai.metrics.logged', {
        provider: this.providerName,
        operation: 'generate',
        usage: response.usage,
        costEstimate: response.costEstimate
      });
    }

    return response;
  }

  async embed(text: string): Promise<{ vector: number[]; usage?: any }> {
    const response = await withResilience(
      () => this.doEmbed(text),
      this.logger,
      this.providerName
    );

    if (response.usage) {
      this.eventEmitter.emit('ai.metrics.logged', {
        provider: this.providerName,
        operation: 'embed',
        usage: response.usage,
      });
    }

    return response;
  }
}
