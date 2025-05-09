import { IsArray, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class UpdateUnitCategoryDto {
    @IsString()
    @IsOptional()
    readonly name: string;

    @IsArray()
    @IsNumber({}, { each: true })
    @IsPositive({ each: true })
    @IsOptional()
    readonly unitOfMeasureIds: number[];

    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly baseUnitId?: number | null; 
}