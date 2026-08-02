export interface AiGenerateOptions {
  stream?: boolean;
  temperature?: number;
}

export interface InternalAiResponse {
  content: string | AsyncGenerator<string>;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  costEstimate?: number;
}

export interface AiProvider {
  providerName: string;
  generate(prompt: string, options?: AiGenerateOptions): Promise<InternalAiResponse>;
  embed(text: string): Promise<{ vector: number[]; usage?: any }>;
}
