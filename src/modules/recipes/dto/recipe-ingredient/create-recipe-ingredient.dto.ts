import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from "class-validator";
import { Recipe } from "../../entities/recipe.entity";

/**
 * Depreciated, only created as a child through {@link Recipe}.
 */
export class CreateRecipeIngredientDto {
    @ApiProperty({ description: 'Id of the Recipe entity that is the parent' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly parentRecipeId: number;

    @ApiProperty({ example: ' 10 lb of flower(Inventory-Item)', description: 'Id of Inventory-Item used as the ingredient, is optional. If inventoryItemId is null, subRecipeIngredientId must be populated, both cannot be populated.' })
    @IsOptional()
    @IsNumber()
    @IsPositive()
    readonly ingredientInventoryItemId?: number;
    
    @ApiProperty({ example: 'Recipe: Blueberry Mix, ingredients: blueberries, sugar. Recipe: Blueberry Pie, ingredients: Blueberry Mix, pie dough, sugar ', description: 'Id of Recipe entity being used as a recipe ingredient, is optional. If subRecipeIngredientId is null, inventoryItemId must be populated, both cannot be populated.' })
    @ApiProperty({ description: '' })
    @IsOptional()
    @IsNumber()
    @IsPositive()
    readonly ingredientRecipeId?: number;

    @ApiProperty({ example: ' 10(quantity) lb of flower', description: 'The unit amount of the Unit-of-Measure of the Inventory-Item' })
    @IsNumber()
    @IsNotEmpty()
    readonly quantity: number;
    
    @ApiProperty({ example: ' 10 lb(Unit-of-Measure.abbreviation) of flower', description: 'Id of the Unit-of-Measure entity.' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly quantityMeasurementId: number;
}