import { IsArray, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class UpdateInventoryItemCategoryDto {
    @IsString()
    @IsOptional()
    readonly name?: string;

    @IsArray()
    @IsPositive({ each: true})
    @IsNumber({}, { each: true})
    @IsOptional()
    readonly inventoryItemIds?: number[];
}