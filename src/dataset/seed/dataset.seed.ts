import { AppDataSource } from '../../data-source';
import { DatasetPair } from '../entities/dataset-pair.entity';
import { SeedMetadata } from '../../rag/entities/seed-metadata.entity';
import { DatasetSeedService } from './dataset-seed.service';

async function seed(): Promise<void> {
  console.log('🌱 Starting Managed Dataset Seed...');
  await AppDataSource.initialize();

  const datasetRepo = AppDataSource.getRepository(DatasetPair);
  const seedMetadataRepo = AppDataSource.getRepository(SeedMetadata);

  const seedService = new DatasetSeedService(datasetRepo, seedMetadataRepo);
  const updated = await seedService.runManagedSeed();

  if (updated) {
    console.log(
      '✅ Dataset seed synchronized successfully with version tracking in seed_metadata.',
    );
  } else {
    console.log('ℹ️ Dataset seed was already up to date with seed_metadata.');
  }

  const total = await datasetRepo.count();
  console.log(`✨ Done! Total dataset pairs in database: ${total}`);
  await AppDataSource.destroy();
}

seed().catch((err: unknown) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
