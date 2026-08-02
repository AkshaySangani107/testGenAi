import { Logger } from '@nestjs/common';

export async function withResilience<T>(
  operation: () => Promise<T>,
  logger: Logger,
  provider: string,
  retries = 3,
  timeoutMs = 15000
): Promise<T> {
  let attempt = 0;
  
  while (attempt < retries) {
    try {
      // 1. Timeout Promise
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs)
      );

      // 2. Race operation against timeout
      return await Promise.race([operation(), timeoutPromise]);
      
    } catch (error: any) {
      attempt++;
      const isRateLimit = error?.status === 429 || error?.code === 429;
      const isTimeout = error?.message === 'TIMEOUT';
      
      if (!isRateLimit && !isTimeout && attempt >= retries) {
        logger.error(`[${provider}] Operation failed after ${attempt} attempts: ${error.message}`);
        throw error;
      }
      
      const backoff = isRateLimit ? 5000 * attempt : 1000 * attempt;
      logger.warn(`[${provider}] Attempt ${attempt} failed (${error.message}). Retrying in ${backoff}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoff));
    }
  }
  throw new Error(`[${provider}] Exhausted all retries.`);
}
