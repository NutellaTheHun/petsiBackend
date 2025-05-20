import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class UpdateUnitOfMeasureDto{
    @ApiProperty({ example: 'Pound, Kilogram, Gallon, fluid ounce', description: 'Name of the Unit-of-Measure entity.' })
    @IsString()
    @IsOptional()
    readonly unitName?: string;

    @ApiProperty({ example: 'UnitOfMeasure: Pound, abbreviation: lb', description: 'abbrieviation of the Unit-of-Measure entity\'s name.' })
    @IsString()
    @IsOptional()
    readonly abbreviation?: string;

    @ApiProperty({ description: 'Id of the Unit-of-Measure-Category entity that the Unit-of-Measure falls under.' })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly categoryId?: number | null;

    @ApiProperty({ example: 'UnitOfMeasure, Gallon, "3785.4080001023799014"(conversionFactorToBase).', description: 'The conversion factor stored as a string to prevent rounding errors, to the base amount.' })
    @IsString()
    @IsOptional()
    readonly conversionFactorToBase?: string;
}