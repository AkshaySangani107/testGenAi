import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatasetPair, DatasetSplit } from './entities/dataset-pair.entity';
import { CreateDatasetPairDto } from './dto/create-dataset-pair.dto';
import { ExportDatasetDto } from './dto/export-dataset.dto';

export interface DatasetStats {
  total: number;
  train: number;
  val: number;
  test: number;
  averageScore: number;
  firstPassCount: number;
  curatedCount: number;
}

export interface ChatMLMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatMLExportEntry {
  messages: ChatMLMessage[];
}

export interface AlpacaExportEntry {
  instruction: string;
  input: string;
  output: string;
}

@Injectable()
export class DatasetService {
  private readonly logger = new Logger(DatasetService.name);

  constructor(
    @InjectRepository(DatasetPair)
    private readonly datasetRepo: Repository<DatasetPair>,
  ) {}

  public async savePair(dto: CreateDatasetPairDto): Promise<DatasetPair> {
    const existing = await this.datasetRepo.findOne({
      where: { sourceHash: dto.sourceHash },
    });

    const split: DatasetSplit = dto.split || this.assignDefaultSplit();

    if (existing) {
      if (dto.evaluationScore > existing.evaluationScore) {
        existing.serviceName = dto.serviceName;
        existing.sourceCode = dto.sourceCode;
        existing.dependencyContract = dto.dependencyContract || null;
        existing.systemPrompt = dto.systemPrompt;
        existing.userPrompt = dto.userPrompt;
        existing.generatedSpec = dto.generatedSpec;
        existing.evaluationScore = dto.evaluationScore;
        existing.passedOnAttempt =
          dto.passedOnAttempt ?? existing.passedOnAttempt;
        existing.methodCoverage = dto.methodCoverage ?? existing.methodCoverage;
        existing.branchCoverage = dto.branchCoverage ?? existing.branchCoverage;
        existing.split = split;
        existing.modelProvider = dto.modelProvider ?? existing.modelProvider;
        if (dto.isCurated !== undefined) {
          existing.isCurated = dto.isCurated;
        }
        this.logger.log(
          `Updated dataset pair for ${dto.serviceName} with higher score ${dto.evaluationScore}`,
        );
        return this.datasetRepo.save(existing);
      }
      return existing;
    }

    const pair = this.datasetRepo.create({
      sourceHash: dto.sourceHash,
      serviceName: dto.serviceName,
      sourceCode: dto.sourceCode,
      dependencyContract: dto.dependencyContract || null,
      systemPrompt: dto.systemPrompt,
      userPrompt: dto.userPrompt,
      generatedSpec: dto.generatedSpec,
      evaluationScore: dto.evaluationScore,
      passedOnAttempt: dto.passedOnAttempt ?? 1,
      methodCoverage: dto.methodCoverage ?? 0,
      branchCoverage: dto.branchCoverage ?? 0,
      split,
      modelProvider: dto.modelProvider || 'gemini',
      isCurated: dto.isCurated ?? false,
    });

    this.logger.log(
      `Saved new dataset pair for ${dto.serviceName} (Score: ${dto.evaluationScore}, Split: ${split})`,
    );
    return this.datasetRepo.save(pair);
  }

  public async getStats(): Promise<DatasetStats> {
    const pairs = await this.datasetRepo.find({
      select: {
        id: true,
        split: true,
        evaluationScore: true,
        passedOnAttempt: true,
        isCurated: true,
      },
    });

    const total = pairs.length;
    let train = 0;
    let val = 0;
    let test = 0;
    let totalScore = 0;
    let firstPassCount = 0;
    let curatedCount = 0;

    for (const p of pairs) {
      if (p.split === 'train') train++;
      else if (p.split === 'val') val++;
      else if (p.split === 'test') test++;

      totalScore += p.evaluationScore;
      if (p.passedOnAttempt === 1) firstPassCount++;
      if (p.isCurated) curatedCount++;
    }

    return {
      total,
      train,
      val,
      test,
      averageScore: total > 0 ? Math.round((totalScore / total) * 10) / 10 : 0,
      firstPassCount,
      curatedCount,
    };
  }

  public async exportJsonl(dto: ExportDatasetDto): Promise<string> {
    const query = this.datasetRepo
      .createQueryBuilder('p')
      .where('p.evaluationScore >= :minScore', {
        minScore: dto.minScore ?? 65,
      });

    if (dto.split && dto.split !== 'all') {
      query.andWhere('p.split = :split', { split: dto.split });
    }

    if (dto.firstPassOnly) {
      query.andWhere('p.passedOnAttempt = 1');
    }

    const pairs = await query.orderBy('p.id', 'ASC').getMany();
    const format = dto.format || 'chatml';
    const lines: string[] = [];

    for (const p of pairs) {
      if (format === 'chatml') {
        const entry: ChatMLExportEntry = {
          messages: [
            { role: 'system', content: p.systemPrompt },
            { role: 'user', content: p.userPrompt },
            { role: 'assistant', content: p.generatedSpec },
          ],
        };
        lines.push(JSON.stringify(entry));
      } else {
        const entry: AlpacaExportEntry = {
          instruction: p.systemPrompt,
          input: p.userPrompt,
          output: p.generatedSpec,
        };
        lines.push(JSON.stringify(entry));
      }
    }

    return lines.join('\n');
  }

  private assignDefaultSplit(): DatasetSplit {
    const rand = Math.random();
    if (rand < 0.8) return 'train';
    if (rand < 0.9) return 'val';
    return 'test';
  }
}
