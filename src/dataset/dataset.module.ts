import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatasetPair } from './entities/dataset-pair.entity';
import { SeedMetadata } from '../rag/entities/seed-metadata.entity';
import { DatasetService } from './dataset.service';
import { DatasetController } from './dataset.controller';
import { DatasetSeedService } from './seed/dataset-seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([DatasetPair, SeedMetadata])],
  controllers: [DatasetController],
  providers: [DatasetService, DatasetSeedService],
  exports: [DatasetService, DatasetSeedService],
})
export class DatasetModule {}
