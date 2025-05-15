import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class CreateUnitOfMeasureDto {
    @ApiProperty({ example: 'Pound, Kilogram, Gallon, fluid ounce', description: 'Name of the Unit-of-Measure entity.' })
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @ApiProperty({ example: 'UnitOfMeasure: Pound, abbreviation: lb', description: 'abbrieviation of the Unit-of-Measure entity\'s name.' })
    @IsString()
    @IsNotEmpty()
    readonly abbreviation: string;

    @ApiProperty({ description: 'Id of the Unit-Category entity that the Unit-of-Measure falls under.' })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly categoryId?: number;

    @ApiProperty({ example: 'UnitOfMeasure, Gallon, "3785.4080001023799014"(conversionFactorToBase).', description: 'The conversion factor stored as a string to prevent rounding errors, to the base amount.' })
    @IsString()
    @IsOptional()
    readonly conversionFactorToBase?: string;
}