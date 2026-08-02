import { VertexAI, GenerativeModel } from '@google-cloud/vertexai';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BaseAiProvider } from './base-ai.provider';
import { AiGenerateOptions, InternalAiResponse } from '../interfaces/ai-provider.interface';

export class VertexAiProvider extends BaseAiProvider {
  providerName = 'VertexAI';
  private generativeModel: GenerativeModel;

  constructor(project: string, location: string, eventEmitter: EventEmitter2) {
    super(eventEmitter);
    const vertexAI = new VertexAI({ project, location });
    this.generativeModel = vertexAI.getGenerativeModel({
      model: 'gemini-1.5-pro-preview-0409'
    });
  }

  protected async doGenerate(prompt: string, options?: AiGenerateOptions): Promise<InternalAiResponse> {
    const response = await this.generativeModel.generateContent(prompt);
    const result = response.response;

    return {
      content: result.candidates?.[0]?.content?.parts?.[0]?.text || '',
      usage: result.usageMetadata ? {
        promptTokens: result.usageMetadata.promptTokenCount || 0,
        completionTokens: result.usageMetadata.candidatesTokenCount || 0,
        totalTokens: result.usageMetadata.totalTokenCount || 0
      } : { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
    };
  }

  protected async doEmbed(text: string): Promise<{ vector: number[]; usage?: any }> {
    throw new Error('Vertex AI native embedding implementation required (omitted for brevity in this factory).');
  }
}
