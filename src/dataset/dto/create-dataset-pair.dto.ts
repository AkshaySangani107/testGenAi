import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsBoolean,
  IsIn,
  Min,
  Max,
} from 'class-validator';

export class CreateDatasetPairDto {
  @IsString()
  @IsNotEmpty()
  sourceHash: string;

  @IsString()
  @IsNotEmpty()
  serviceName: string;

  @IsString()
  @IsNotEmpty()
  sourceCode: string;

  @IsString()
  @IsOptional()
  dependencyContract?: string;

  @IsString()
  @IsNotEmpty()
  systemPrompt: string;

  @IsString()
  @IsNotEmpty()
  userPrompt: string;

  @IsString()
  @IsNotEmpty()
  generatedSpec: string;

  @IsInt()
  @Min(0)
  @Max(100)
  evaluationScore: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(5)
  passedOnAttempt?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(100)
  methodCoverage?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(100)
  branchCoverage?: number;

  @IsString()
  @IsOptional()
  @IsIn(['train', 'val', 'test'])
  split?: 'train' | 'val' | 'test';

  @IsString()
  @IsOptional()
  modelProvider?: string;

  @IsBoolean()
  @IsOptional()
  isCurated?: boolean;
}
