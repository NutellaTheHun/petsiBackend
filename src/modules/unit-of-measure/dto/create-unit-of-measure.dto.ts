import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class CreateUnitOfMeasureDto {
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @IsString()
    @IsNotEmpty()
    readonly abbreviation: string;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly categoryId?: number;

    @IsString()
    @IsOptional()
    readonly conversionFactorToBase?: string;
}