import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsNumber, IsOptional, IsPositive, IsString, Min, ValidateNested } from "class-validator";
import { RecipeIngredientUnionResolver } from "../../utils/recipe-ingredient-union-resolver";
import { CreateChildRecipeIngredientDto } from "../recipe-ingredient/create-child-recipe-ingredient.dto";
import { UpdateChildRecipeIngredientDto } from "../recipe-ingredient/update-child-recipe-ingedient.dto";

export class UpdateRecipeDto {
    @ApiProperty({ description: 'Name of the Recipe entity.' })
    @IsString()
    @IsOptional()
    readonly recipeName?: string;

    @ApiProperty({
        example: 'MenuItem: Chocolate Bourbon Pecan', description: 'Id of the MenuItem that the recipe produces.',
    })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly producedMenuItemId?: number | null;

    @ApiProperty({ example: 'Recipe: Blueberry Mix.', description: 'If the recipe is used as an ingredient.(Not sold directly)' })
    @IsBoolean()
    @IsOptional()
    readonly isIngredient?: boolean;

    @ApiProperty({ example: '3(batchResultQuantity) units of Blueberry Pie, 4(batchResultQuantity) lbs of pie dough', description: 'The unit amount the recipe produces of the referenced BatchUnitOfMeasure UnitofMeasure entity.' })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly batchResultQuantity?: number | null;

    @ApiProperty({
        example: '3 units(batchResultUnitOfMeasure) of Blueberry Pie, 4 lbs(batchResultUnitOfMeasure.abbreviation) of pie dough',
        description: 'Id of the UnitofMeasure entity expressing the unit size of what the recipe produces.',
    })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly batchResultMeasurementId?: number | null;

    @ApiProperty({ description: 'The unit amount of the servingSizeUnitOfMeasure describing the amount that is sold.' })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly servingSizeQuantity?: number | null;

    @ApiProperty({
        description: 'Id of the UnitofMeasure used to represent the unit size of what is sold.',
    })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly servingSizeMeasurementId?: number | null;

    @ApiProperty({ description: 'The price of purchasing the serving size amount.' })
    @IsNumber()
    @IsOptional()
    @Min(0)
    readonly salesPrice?: number | null;

    @ApiProperty({
        description: 'Id of the RecipeCategory entity',
    })
    @IsNumber()
    @IsOptional()
    @IsPositive()
    readonly categoryId?: number | null;

    @ApiProperty({
        description: 'Id of the RecipeSubCategory entity. Must be a child subcategory to the referenced RecipeCategory',
    })
    @IsNumber()
    @IsOptional()
    @IsPositive()
    readonly subCategoryId?: number | null;

    @ApiProperty({
        description: 'Mixed array of CreateChildRecipeIngredientDtos and UpdateChildRecipeIngredientDtos. Child dtos are used when creating/updating child RecipeIngredient entites through updating the Recipe entity.',
        type: [UpdateChildRecipeIngredientDto]
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RecipeIngredientUnionResolver)
    readonly ingredientDtos?: (CreateChildRecipeIngredientDto | UpdateChildRecipeIngredientDto)[];
}