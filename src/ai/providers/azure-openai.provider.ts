import { AzureOpenAI } from 'openai';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BaseAiProvider } from './base-ai.provider';
import { AiGenerateOptions, InternalAiResponse } from '../interfaces/ai-provider.interface';

export class AzureOpenAIProvider extends BaseAiProvider {
  providerName = 'AzureOpenAI';
  private client: AzureOpenAI;
  private deploymentName: string;
  private embeddingDeploymentName: string;

  constructor(endpoint: string, apiKey: string, deploymentName: string, embeddingDeploymentName: string, eventEmitter: EventEmitter2) {
    super(eventEmitter);
    this.client = new AzureOpenAI({ 
      endpoint, 
      apiKey, 
      deployment: deploymentName 
    });
    this.deploymentName = deploymentName;
    this.embeddingDeploymentName = embeddingDeploymentName;
  }

  protected async doGenerate(prompt: string, options?: AiGenerateOptions): Promise<InternalAiResponse> {
    const response = await this.client.chat.completions.create({
      model: this.deploymentName,
      messages: [{ role: 'user', content: prompt }],
      temperature: options?.temperature,
      stream: false,
    });

    return {
      content: response.choices[0]?.message?.content || '',
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens || 0,
        totalTokens: response.usage.total_tokens
      } : undefined
    };
  }

  protected async doEmbed(text: string): Promise<{ vector: number[]; usage?: any }> {
    const response = await this.client.embeddings.create({
      model: this.embeddingDeploymentName,
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
