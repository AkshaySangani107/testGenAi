import { Logger } from '@nestjs/common';

export async function withResilience<T>(
  operation: () => Promise<T>,
  logger: Logger,
  provider: string,
  retries = 3,
  timeoutMs = Number(process.env.AI_TIMEOUT_MS) || 60000,
): Promise<T> {
  let attempt = 0;

  while (attempt < retries) {
    try {
      // 1. Timeout Promise
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs),
      );

      // 2. Race operation against timeout
      return await Promise.race([operation(), timeoutPromise]);
    } catch (error: unknown) {
      attempt++;
      const rec =
        typeof error === 'object' && error !== null
          ? (error as Record<string, unknown>)
          : {};
      const status =
        typeof rec.status === 'number'
          ? rec.status
          : typeof rec.code === 'number'
            ? rec.code
            : 0;
      const errMsg =
        error instanceof Error
          ? error.message
          : typeof rec.message === 'string'
            ? rec.message
            : String(error);
      const isRateLimit = status === 429;
      const isTimeout = errMsg === 'TIMEOUT';

      if (!isRateLimit && !isTimeout && attempt >= retries) {
        logger.error(
          `[${provider}] Operation failed after ${attempt} attempts: ${errMsg}`,
        );
        throw error instanceof Error ? error : new Error(errMsg);
      }

      const backoff = isRateLimit ? 5000 * attempt : 1000 * attempt;
      logger.warn(
        `[${provider}] Attempt ${attempt} failed (${errMsg}). Retrying in ${backoff}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }
  throw new Error(`[${provider}] Exhausted all retries.`);
}
