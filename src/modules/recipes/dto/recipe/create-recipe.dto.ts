import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { CreateChildRecipeIngredientDto } from '../recipe-ingredient/create-child-recipe-ingredient.dto';

export class CreateRecipeDto {
  @ApiProperty({
    description: 'Name of the Recipe entity.',
    example: 'Blueberry Pie',
  })
  @IsString()
  @IsNotEmpty()
  readonly recipeName: string;

  @ApiProperty({
    description: 'Id of the MenuItem that the recipe produces.',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly producedMenuItemId?: number;

  @ApiProperty({
    description: 'If the recipe is used as an ingredient.(Not sold directly)',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  readonly isIngredient?: boolean;

  @ApiProperty({
    description:
      'The unit amount the recipe produces of the referenced BatchUnitOfMeasure UnitofMeasure entity.',
    example: 2,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly batchResultQuantity: number;

  @ApiProperty({
    description:
      'Id of the UnitofMeasure entity expressing the unit size of what the recipe produces.',
    example: 3,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly batchResultMeasurementId: number;

  @ApiProperty({
    description:
      'The unit amount of the servingSizeUnitOfMeasure describing the amount that is sold.',
    example: 4,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly servingSizeQuantity: number;

  @ApiProperty({
    description:
      'Id of the UnitofMeasure used to represent the unit size of what is sold.',
    example: 5,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly servingSizeMeasurementId: number;

  @ApiProperty({
    description: 'The price of purchasing the serving size amount.',
    example: 6,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  readonly salesPrice?: number;

  @ApiProperty({
    description: 'Id of the RecipeCategory entity',
    example: 7,
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  readonly categoryId?: number;

  @ApiProperty({
    description:
      'Id of the RecipeSubCategory entity. Must be a child subcategory to the referenced RecipeCategory',
    example: 8,
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  readonly subCategoryId?: number;

  @ApiProperty({
    description:
      'Array of CreateChildRecipeIngredientDtos. Child dtos are used when creating child RecipeIngredient entites through creating the Recipe entity.',
    type: [CreateChildRecipeIngredientDto],
    example: [
      {
        mode: 'create',
        ingredientInventoryItemId: 1,
        ingredientRecipeId: null,
        quantity: 2,
        quantityMeasurementId: 3,
      },
      {
        mode: 'create',
        ingredientInventoryItemId: null,
        ingredientRecipeId: 4,
        quantity: 5,
        quantityMeasurementId: 6,
      },
    ],
  })
  @IsOptional()
  @IsArray()
  ingredientDtos?: CreateChildRecipeIngredientDto[];
}
