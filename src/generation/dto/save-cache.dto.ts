import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class SaveSpecCacheDto {
  @IsString()
  @IsNotEmpty()
  sourceContent: string;

  @IsString()
  @IsNotEmpty()
  className: string;

  @IsString()
  @IsNotEmpty()
  specContent: string;

  @IsNumber()
  score: number;

  @IsNumber()
  attempts: number;

  @IsString()
  @IsOptional()
  modelProvider?: string;
}
