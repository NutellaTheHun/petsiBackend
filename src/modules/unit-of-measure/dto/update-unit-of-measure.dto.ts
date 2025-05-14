import { IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class UpdateUnitOfMeasureDto{
    @IsString()
    @IsOptional()
    readonly name?: string;

    @IsString()
    @IsOptional()
    readonly abbreviation?: string;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly categoryId?: number;

    @IsString()
    @IsOptional()
    readonly conversionFactorToBase?: string;
}