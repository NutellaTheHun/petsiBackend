import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class UpdateUnitOfMeasureCategoryDto {
    @ApiProperty({ example: 'Weight, Volume, Unit', description: 'Name of Unit-Category entity.' })
    @IsString()
    @IsOptional()
    readonly categoryName?: string;

    @ApiProperty({ description: 'The Unit-Of-Measure entity that all Unit-of-Measure entities under the category convert to as part of conversions.' })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly baseUnitId?: number | null; 
}