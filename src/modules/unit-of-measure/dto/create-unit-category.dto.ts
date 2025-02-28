import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class CreateUnitCategoryDto{
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @IsArray()
    @IsNumber({}, { each: true })
    @IsPositive({ each: true })
    readonly unitOfMeasureIds: number[] = [];

    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly baseUnitId?: number | null; 
}

export function CreateDefaultUnitCategoryDtoValues(): Partial<CreateUnitCategoryDto> {
    return {
        unitOfMeasureIds: [],
        baseUnitId: null,
    };
}