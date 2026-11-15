import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Res,
  Header,
} from '@nestjs/common';
import type { Response } from 'express';
import { DatasetService, DatasetStats } from './dataset.service';
import { CreateDatasetPairDto } from './dto/create-dataset-pair.dto';
import { ExportDatasetDto } from './dto/export-dataset.dto';
import { DatasetPair } from './entities/dataset-pair.entity';

@Controller('dataset')
export class DatasetController {
  constructor(private readonly datasetService: DatasetService) {}

  @Post('pair')
  public async savePair(
    @Body() dto: CreateDatasetPairDto,
  ): Promise<DatasetPair> {
    return this.datasetService.savePair(dto);
  }

  @Get('stats')
  public async getStats(): Promise<DatasetStats> {
    return this.datasetService.getStats();
  }

  @Get('export')
  @Header('Content-Type', 'application/x-jsonlines')
  public async exportDataset(
    @Query() dto: ExportDatasetDto,
    @Res() res: Response,
  ): Promise<void> {
    const jsonl = await this.datasetService.exportJsonl(dto);
    const filename = `dataset-${dto.split || 'all'}-${dto.format || 'chatml'}.jsonl`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(jsonl);
  }
}
