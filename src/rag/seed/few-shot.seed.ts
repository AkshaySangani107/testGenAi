/**
 * Few-Shot Example Seed Registry
 *
 * Each spec example file defines its own version and SeedDefinition.
 * This registry aggregates them for easy consumption by the SeedManagerService.
 */

import {
  crudServiceSeed,
  authServiceSeed,
  eventQueueServiceSeed,
  redisCacheServiceSeed,
  automapperServiceSeed,
  httpServiceSeed,
} from './examples';
import { SeedDefinition } from './types/seed-definition.type';

export const allFewShotSeeds: SeedDefinition[] = [
  crudServiceSeed,
  authServiceSeed,
  eventQueueServiceSeed,
  redisCacheServiceSeed,
  automapperServiceSeed,
  httpServiceSeed,
];

// Re-export individual seeds and versions for external direct access
export * from './examples';
export * from './types/seed-definition.type';
