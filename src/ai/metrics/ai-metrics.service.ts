import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiMetrics } from './ai-metrics.entity';

@Injectable()
export class AiMetricsService {
  private readonly logger = new Logger('AiMetrics');

  constructor(
    @InjectRepository(AiMetrics)
    private readonly metricsRepo: Repository<AiMetrics>,
  ) {}

  @OnEvent('ai.metrics.logged')
  async handleMetricsEvent(payload: any) {
    this.logger.log(
      `[${payload.provider}] ${payload.operation.toUpperCase()} ` +
      `| Tokens: ${payload.usage?.totalTokens || 0} ` +
      `| Cost: $${payload.costEstimate?.toFixed(6) || 0}`
    );

    try {
      const metric = this.metricsRepo.create({
        provider: payload.provider,
        operation: payload.operation,
        promptTokens: payload.usage?.promptTokens || 0,
        completionTokens: payload.usage?.completionTokens || 0,
        totalTokens: payload.usage?.totalTokens || 0,
        costEstimate: payload.costEstimate || 0,
      });
      await this.metricsRepo.save(metric);
    } catch (error) {
      this.logger.error('Failed to save metrics to DB', error);
    }
  }
}
