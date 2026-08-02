import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class AiMetricsService {
  private readonly logger = new Logger('AiMetrics');

  @OnEvent('ai.metrics.logged')
  handleMetricsEvent(payload: any) {
    // Structured logging for token and cost usage tracking.
    // In a production scenario, you could push this to Datadog, Prometheus, or your DB.
    this.logger.log(
      `[${payload.provider}] ${payload.operation.toUpperCase()} ` +
      `| Tokens: ${payload.usage?.totalTokens || 0} ` +
      `| Cost: $${payload.costEstimate?.toFixed(6) || 0}`
    );
  }
}
