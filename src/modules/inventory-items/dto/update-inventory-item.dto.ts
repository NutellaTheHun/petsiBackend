import { Type } from "class-transformer";
import { IsArray, IsNumber, IsOptional, IsPositive, IsString, ValidateNested } from "class-validator";
import { RecipeIngredientUnionResolver } from "../../recipes/utils/recipe-ingredient-union-resolver";
import { CreateInventoryItemSizeDto } from "./create-inventory-item-size.dto";
import { UpdateInventoryItemSizeDto } from "./update-inventory-item-size.dto";

export class UpdateInventoryItemDto {
    @IsString()
    @IsOptional()
    readonly name: string;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly inventoryItemCategoryId: number;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly vendorId: number;
    
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RecipeIngredientUnionResolver)
    readonly sizeDtos?: (CreateInventoryItemSizeDto | UpdateInventoryItemSizeDto)[];
}