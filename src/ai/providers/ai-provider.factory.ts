import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OpenAIProvider } from './openai.provider';
import { AnthropicProvider } from './anthropic.provider';
import { GeminiProvider } from './gemini.provider';
import { OllamaProvider } from './ollama.provider';
import { AzureOpenAIProvider } from './azure-openai.provider';
import { AwsBedrockProvider } from './aws-bedrock.provider';
import { VertexAiProvider } from './vertex-ai.provider';
import { GroqProvider } from './groq.provider';

export const AI_PROVIDER_STRATEGY_TOKEN = 'AI_PROVIDER_STRATEGY';

export const aiProviderFactory = {
  provide: AI_PROVIDER_STRATEGY_TOKEN,
  inject: [ConfigService, EventEmitter2],
  useFactory: (config: ConfigService, eventEmitter: EventEmitter2) => {
    // As per user request, we DO NOT rely on .env for defaults if they aren't provided safely.
    // The user will manage their own .env files.
    const provider = config.get<string>('ACTIVE_AI_PROVIDER', process.env.ACTIVE_AI_PROVIDER ?? "openai").toLowerCase();
    console.log('Using provider:', provider);
    switch (provider) {
      case 'anthropic':
        return new AnthropicProvider(config.getOrThrow('ANTHROPIC_API_KEY'), eventEmitter);

      case 'gemini':
        return new GeminiProvider(config.getOrThrow('GEMINI_API_KEY'), eventEmitter);

      case 'ollama':
        return new OllamaProvider(config.get('OLLAMA_BASE_URL', 'http://localhost:11434'), eventEmitter);

      case 'azure':
        return new AzureOpenAIProvider(
          config.getOrThrow('AZURE_OPENAI_ENDPOINT'),
          config.getOrThrow('AZURE_OPENAI_API_KEY'),
          config.getOrThrow('AZURE_OPENAI_DEPLOYMENT_NAME'),
          config.getOrThrow('AZURE_OPENAI_EMBEDDING_DEPLOYMENT'),
          eventEmitter
        );

      case 'bedrock':
        return new AwsBedrockProvider(
          config.getOrThrow('AWS_REGION'),
          config.getOrThrow('AWS_ACCESS_KEY_ID'),
          config.getOrThrow('AWS_SECRET_ACCESS_KEY'),
          eventEmitter
        );

      case 'vertex':
        return new VertexAiProvider(
          config.getOrThrow('GOOGLE_CLOUD_PROJECT'),
          config.getOrThrow('GOOGLE_CLOUD_LOCATION'),
          eventEmitter
        );

      case 'groq':
        return new GroqProvider(config.getOrThrow('GROQ_API_KEY'), config.getOrThrow('GEMINI_API_KEY'), eventEmitter);

      case 'openai':
      default:
        return new OpenAIProvider(config.getOrThrow('OPENAI_API_KEY'), eventEmitter);
    }
  }
}
