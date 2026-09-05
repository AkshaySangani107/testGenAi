import { IsNotEmpty, IsString } from "class-validator";

export class EvaluateRequestDto {

    @IsString()
    @IsNotEmpty()
    specContent: string;

    @IsString()
    @IsNotEmpty()
    compactClass: string;
}
