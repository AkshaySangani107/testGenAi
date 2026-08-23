import Groq from 'groq-sdk';
import { GoogleGenAI } from '@google/genai';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BaseAiProvider } from './base-ai.provider';
import { AiGenerateOptions, InternalAiResponse } from '../interfaces/ai-provider.interface';

export class GroqProvider extends BaseAiProvider {
  providerName = 'Groq (+Gemini Embeddings)';
  private client: Groq;
  private geminiClient: GoogleGenAI;

  constructor(groqApiKey: string, geminiApiKey: string, eventEmitter: EventEmitter2) {
    super(eventEmitter);
    this.client = new Groq({ apiKey: groqApiKey });
    this.geminiClient = new GoogleGenAI({ apiKey: geminiApiKey });
  }

  protected async doGenerate(prompt: string, options?: AiGenerateOptions): Promise<InternalAiResponse> {
    const response = await this.client.chat.completions.create({
      model: 'openai/gpt-oss-20b', // Default high-performance model for Groq
      messages: [{ role: 'user', content: prompt }],
      temperature: options?.temperature,
      // max_tokens: 8192,
      stream: false,
    });

    return {
      content: response.choices[0]?.message?.content || '',
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens || 0,
        completionTokens: response.usage.completion_tokens || 0,
        totalTokens: response.usage.total_tokens || 0
      } : { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      costEstimate: 0 // Groq pricing varies, simplified to 0 for demo
    };
  }

  protected async doEmbed(text: string): Promise<{ vector: number[]; usage?: any }> {
    // Groq doesn't provide native embeddings, so we fallback to Gemini as requested
    const response = await this.geminiClient.models.embedContent({
      model: 'gemini-embedding-001',
      contents: text,
    });

    return {
      vector: response.embeddings?.[0].values || []
    };
  }
}
