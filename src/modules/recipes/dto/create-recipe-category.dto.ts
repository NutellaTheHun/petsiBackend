import { IsArray, IsNotEmpty, IsNumber, IsPositive, IsString } from "class-validator";

export class CreateRecipeCategoryDto {
    @IsString()
    @IsNotEmpty()
    readonly name: string;
}