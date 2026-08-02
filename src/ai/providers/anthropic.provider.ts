


import Anthropic from '@anthropic-ai/sdk';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BaseAiProvider } from './base-ai.provider';
import { AiGenerateOptions, InternalAiResponse } from '../interfaces/ai-provider.interface';

export class AnthropicProvider extends BaseAiProvider {
  providerName = 'Anthropic';
  private client: Anthropic;

  constructor(apiKey: string, eventEmitter: EventEmitter2) {
    super(eventEmitter);
    this.client = new Anthropic({ apiKey });
  }

  protected async doGenerate(prompt: string, options?: AiGenerateOptions): Promise<InternalAiResponse> {
    const msg = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
      temperature: options?.temperature
    });

    const contentBlock = msg.content.find(block => block.type === 'text') as Anthropic.TextBlock;

    return {
      content: contentBlock ? contentBlock.text : '',
      usage: {
        promptTokens: msg.usage.input_tokens,
        completionTokens: msg.usage.output_tokens,
        totalTokens: msg.usage.input_tokens + msg.usage.output_tokens
      },
      costEstimate: (msg.usage.input_tokens * 0.000003) + (msg.usage.output_tokens * 0.000015)
    };
  }

  protected async doEmbed(text: string): Promise<{ vector: number[]; usage?: any }> {
    throw new Error('Anthropic does not natively support embeddings in this SDK version.');
  }
}
