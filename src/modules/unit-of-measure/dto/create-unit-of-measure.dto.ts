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
    readonly categoryId: number;

    @IsString()
    @IsOptional()
    readonly conversionFactorToBase?: string;
}
/**
 * If the DTO doesn't involve updating the category, categoryId must be undefined,
 * setting the category specifically handles either a category entity or a null value.
 * @returns 
 */
export function CreateDefaultUnitOfMeasureDtoValues(): Partial<CreateUnitOfMeasureDto> {
    return {
        //categoryId: undefined,
    };
}