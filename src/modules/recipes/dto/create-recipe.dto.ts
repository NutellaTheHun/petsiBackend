import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min } from "class-validator";
import { CreateChildRecipeIngredientDto } from "./create-child-recipe-ingredient.dto";
import { ApiProperty } from "@nestjs/swagger";

export class CreateRecipeDto {
    @ApiProperty({ description: 'Name of the Recipe entity.' })
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @ApiProperty({ example: 'Menu-Item: Chocolate Bourbon Pecan', description: 'Id of the Menu-Item that the recipe produces.' })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    readonly menuItemId?: number;

    @ApiProperty({ example: 'Recipe: Blueberry Mix.', description: 'If the recipe is used as an ingredient.(Not sold directly)' })
    @IsBoolean()
    @IsOptional()
    readonly isIngredient?: boolean;

    @ApiProperty({ example: '3(batchResultQuantity) units of Blueberry Pie, 4(batchResultQuantity) lbs of pie dough', description: 'The unit amount the recipe produces of the referenced BatchUnitOfMeasure Unit-of-Measure entity.' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly batchResultQuantity: number;
    
    @ApiProperty({ example: '3 units(batchResultUnitOfMeasure) of Blueberry Pie, 4 lbs(batchResultUnitOfMeasure.abbreviation) of pie dough', description: 'Id of the Unit-of-Measure entity expressing the unit size of what the recipe produces.' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()  
    readonly batchResultUnitOfMeasureId: number;
    
    @ApiProperty({ description: 'The unit amount of the servingSizeUnitOfMeasure describing the amount that is sold.' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly servingSizeQuantity: number;
    
    @ApiProperty({ description: 'Id of the Unit-of-Measure used to represent the unit size of what is sold.' })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()    
    readonly servingSizeUnitOfMeasureId: number;

    @ApiProperty({ description: 'The price of purchasing the serving size amount.' })
    @IsNumber()
    @IsOptional()
    @Min(0)
    readonly salesPrice?: number;

    @ApiProperty({ description: 'The total cost of the recipe.' })
    @IsNumber()
    @IsOptional()
    @Min(0)
    readonly cost?: number;

    @ApiProperty({ description: 'Id of the Recipe-Category entity' })
    @IsNumber()
    @IsOptional()
    @IsPositive()
    readonly categoryId?: number;

    @ApiProperty({ description: 'Id of the Recipe-Sub-Category entity. Must be a child sub-category to the referenced Recipe-Category' })
    @IsNumber()
    @IsOptional()
    @IsPositive()
    readonly subCategoryId?: number;

    @ApiProperty({ 
        description: 'Array of CreateChildRecipeIngredientDtos. Child dtos are used when creating child Recipe-Ingredient entites through creating the Recipe entity.', 
        type: [CreateChildRecipeIngredientDto],
    })
    @IsOptional()
    @IsArray()
    ingredientDtos?: CreateChildRecipeIngredientDto[];
}