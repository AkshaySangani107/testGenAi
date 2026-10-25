import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BaseAiProvider } from './base-ai.provider';
import {
  AiGenerateOptions,
  InternalAiResponse,
} from '../interfaces/ai-provider.interface';

export class AwsBedrockProvider extends BaseAiProvider {
  providerName = 'AwsBedrock';
  private client: BedrockRuntimeClient;

  constructor(
    region: string,
    accessKeyId: string,
    secretAccessKey: string,
    eventEmitter: EventEmitter2,
  ) {
    super(eventEmitter);
    this.client = new BedrockRuntimeClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  protected async doGenerate(
    prompt: string,
    options?: AiGenerateOptions,
  ): Promise<InternalAiResponse> {
    // Using Claude v3 on Bedrock as an example
    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 1024,
      messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
      temperature: options?.temperature,
    };

    const command = new InvokeModelCommand({
      modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    });

    const response = await this.client.send(command);
    const responseBody = JSON.parse(
      new TextDecoder().decode(response.body),
    ) as {
      content?: { text?: string }[];
      usage?: { input_tokens?: number; output_tokens?: number };
    };

    const inputTokens = responseBody.usage?.input_tokens || 0;
    const outputTokens = responseBody.usage?.output_tokens || 0;

    return {
      content: responseBody.content?.[0]?.text || '',
      usage: responseBody.usage
        ? {
            promptTokens: inputTokens,
            completionTokens: outputTokens,
            totalTokens: inputTokens + outputTokens,
          }
        : undefined,
    };
  }

  protected async doEmbed(
    text: string,
  ): Promise<{ vector: number[]; usage?: unknown }> {
    // Titan Text Embeddings V2
    const command = new InvokeModelCommand({
      modelId: 'amazon.titan-embed-text-v2:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({ inputText: text }),
    });

    const response = await this.client.send(command);
    const responseBody = JSON.parse(
      new TextDecoder().decode(response.body),
    ) as {
      embedding?: number[];
      inputTextTokenCount?: number;
    };
    const inputTokenCount = responseBody.inputTextTokenCount || 0;

    return {
      vector: responseBody.embedding || [],
      usage: {
        promptTokens: inputTokenCount,
        completionTokens: 0,
        totalTokens: inputTokenCount,
      },
    };
  }
}
