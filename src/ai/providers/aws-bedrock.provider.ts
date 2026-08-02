import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BaseAiProvider } from './base-ai.provider';
import { AiGenerateOptions, InternalAiResponse } from '../interfaces/ai-provider.interface';

export class AwsBedrockProvider extends BaseAiProvider {
  providerName = 'AwsBedrock';
  private client: BedrockRuntimeClient;

  constructor(region: string, accessKeyId: string, secretAccessKey: string, eventEmitter: EventEmitter2) {
    super(eventEmitter);
    this.client = new BedrockRuntimeClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });
  }

  protected async doGenerate(prompt: string, options?: AiGenerateOptions): Promise<InternalAiResponse> {
    // Using Claude v3 on Bedrock as an example
    const payload = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 1024,
      messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
      temperature: options?.temperature
    };

    const command = new InvokeModelCommand({
      modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload)
    });

    const response = await this.client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    return {
      content: responseBody.content?.[0]?.text || '',
      usage: responseBody.usage ? {
        promptTokens: responseBody.usage.input_tokens,
        completionTokens: responseBody.usage.output_tokens,
        totalTokens: responseBody.usage.input_tokens + responseBody.usage.output_tokens
      } : undefined
    };
  }

  protected async doEmbed(text: string): Promise<{ vector: number[]; usage?: any }> {
    // Titan Text Embeddings V2
    const command = new InvokeModelCommand({
      modelId: 'amazon.titan-embed-text-v2:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({ inputText: text })
    });

    const response = await this.client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    return {
      vector: responseBody.embedding,
      usage: {
        promptTokens: responseBody.inputTextTokenCount,
        completionTokens: 0,
        totalTokens: responseBody.inputTextTokenCount
      }
    };
  }
}
