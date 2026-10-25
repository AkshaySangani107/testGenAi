import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiMetrics } from './ai-metrics.entity';

interface MetricsPayload {
  provider: string;
  operation: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  costEstimate?: number;
}

@Injectable()
export class AiMetricsService {
  private readonly logger = new Logger('AiMetrics');

  constructor(
    @InjectRepository(AiMetrics)
    private readonly metricsRepo: Repository<AiMetrics>,
  ) {}

  @OnEvent('ai.metrics.logged')
  async handleMetricsEvent(payload: MetricsPayload): Promise<void> {
    const totalTokens = payload.usage?.totalTokens || 0;
    const costEstimate = payload.costEstimate || 0;

    this.logger.log(
      `[${payload.provider}] ${payload.operation.toUpperCase()} ` +
        `| Tokens: ${totalTokens} ` +
        `| Cost: $${costEstimate.toFixed(6)}`,
    );

    try {
      const metric = this.metricsRepo.create({
        provider: payload.provider,
        operation: payload.operation,
        promptTokens: payload.usage?.promptTokens || 0,
        completionTokens: payload.usage?.completionTokens || 0,
        totalTokens,
        costEstimate,
      });
      await this.metricsRepo.save(metric);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to save metrics to DB: ${errMsg}`);
    }
  }
}
