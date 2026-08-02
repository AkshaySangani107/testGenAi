import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiService } from './ai.service';
import { aiProviderFactory } from './providers/ai-provider.factory';
import { AiMetricsService } from './metrics/ai-metrics.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    aiProviderFactory,
    AiService,
    AiMetricsService,
  ],
  exports: [AiService],
})
export class AiModule {}
