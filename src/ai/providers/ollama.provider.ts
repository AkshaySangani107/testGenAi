import { EventEmitter2 } from '@nestjs/event-emitter';
import { BaseAiProvider } from './base-ai.provider';
import { AiGenerateOptions, InternalAiResponse } from '../interfaces/ai-provider.interface';

export class OllamaProvider extends BaseAiProvider {
  providerName = 'Ollama';
  private readonly baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:11434', eventEmitter: EventEmitter2) {
    super(eventEmitter);
    this.baseUrl = baseUrl;
  }

  protected async doGenerate(prompt: string, options?: AiGenerateOptions): Promise<InternalAiResponse> {
    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        model: 'llama3', 
        prompt, 
        stream: false,
        options: {
          temperature: options?.temperature
        }
      }),
    });
    
    if (!res.ok) throw new Error(`Ollama API error: ${res.statusText}`);
    
    const data = await res.json();
    return {
      content: data.response,
      usage: {
        promptTokens: data.prompt_eval_count,
        completionTokens: data.eval_count,
        totalTokens: data.prompt_eval_count + data.eval_count
      },
      costEstimate: 0 // Local models are free
    };
  }

  protected async doEmbed(text: string): Promise<{ vector: number[]; usage?: any }> {
    const res = await fetch(`${this.baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'nomic-embed-text', prompt: text }),
    });
    
    if (!res.ok) throw new Error(`Ollama API error: ${res.statusText}`);
    
    const data = await res.json();
    return {
      vector: data.embedding
    };
  }
}
