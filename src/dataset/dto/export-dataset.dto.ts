import { IsString, IsOptional, IsIn, IsInt, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class ExportDatasetDto {
  @IsString()
  @IsOptional()
  @IsIn(['chatml', 'alpaca'])
  format?: 'chatml' | 'alpaca' = 'chatml';

  @IsString()
  @IsOptional()
  @IsIn(['all', 'train', 'val', 'test'])
  split?: 'all' | 'train' | 'val' | 'test' = 'all';

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  minScore?: number = 65;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  firstPassOnly?: boolean = false;
}
