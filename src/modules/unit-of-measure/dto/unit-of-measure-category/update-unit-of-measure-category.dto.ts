import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class UpdateUnitOfMeasureCategoryDto {
    @ApiProperty({ example: 'Weight, Volume, Unit', description: 'Name of UnitCategory entity.' })
    @IsString()
    @IsOptional()
    readonly categoryName?: string;

    @ApiProperty({ description: 'The UnitOfMeasure entity that all UnitofMeasure entities under the category convert to as part of conversions.' })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly baseUnitId?: number | null;
}