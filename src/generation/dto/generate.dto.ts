import { IsString, IsNotEmpty } from 'class-validator';

export class GenerateTestDto {
    @IsString()
    @IsNotEmpty()
    fileContent: string;
}
