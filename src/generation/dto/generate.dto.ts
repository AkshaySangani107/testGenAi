import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class GenerateTestDto {
    @IsString()
    @IsNotEmpty()
    fileContent: string;

    @IsOptional()
    @IsString()
    dependencyContext?: string;
}
