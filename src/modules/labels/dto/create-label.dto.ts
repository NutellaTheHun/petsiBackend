import { IsNotEmpty, IsNumber, IsObject, IsOptional, IsPositive } from "class-validator";

export class CreateLabelDto {
    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    readonly menuItemId: number;

    @IsOptional()
    @IsObject() // might need further validation of its URLs
    readonly labelUrls: Record<string, string> = {};
}
