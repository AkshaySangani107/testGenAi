import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiService } from './ai.service';
import { aiProviderFactory } from './providers/ai-provider.factory';
import { AiMetricsService } from './metrics/ai-metrics.service';
import { AiMetrics } from './metrics/ai-metrics.entity';

@Global()
@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([AiMetrics])],
  providers: [
    aiProviderFactory,
    AiService,
    AiMetricsService,
  ],
  exports: [AiService],
})
export class AiModule {}
