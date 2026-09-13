import { IsArray, IsNotEmpty, IsString, ArrayMinSize, IsOptional } from 'class-validator'

export class RetryGenerateDto {
    @IsString()
    @IsNotEmpty()
    fileContent: string

    @IsString()
    @IsNotEmpty()
    previousSpec: string

    @IsArray()
    @ArrayMinSize(1)
    @IsString({ each: true })
    feedback: string[]

    @IsOptional()
    @IsString()
    dependencyContext: string
}