import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class CreateUnitCategoryDto{
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @IsArray()
    @IsNumber({}, { each: true })
    unitOfMeasureIds: number[] = [];

    @IsNumber()
    @IsPositive()
    @IsOptional()
    baseUnitId?: number; 
}