import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class CreateUnitCategoryDto{
    @ApiProperty({ example: 'Weight, Volume, Unit', description: 'Name of Unit-Category entity.' })
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @ApiProperty({ description: 'Id of Unit-of-Measure entities under the Unit-Category.' })
    @IsArray()
    @IsNumber({}, { each: true })
    @IsPositive({ each: true })
    @IsOptional()
    readonly unitOfMeasureIds?: number[];

    @ApiProperty({ description: 'The Unit-Of-Measure entity that all Unit-of-Measure entities under the category convert to as part of conversions.' })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly baseUnitId?: number | null; 
}