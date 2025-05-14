import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class UpdateChildRecipeSubCategoryDto {
    readonly mode: 'update' = 'update'

    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly id: number;

    @IsString()
    @IsOptional()
    readonly name?: string;

    @IsNumber()
    @IsOptional()
    @IsPositive()
    readonly parentCategoryId?: number;
}