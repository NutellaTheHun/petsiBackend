import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { NestedRecipeIngredientDto } from '../recipe-ingredient/nested-recipe-ingredient.dto';

export class UpdateRecipeDto {
  @ApiPropertyOptional({
    description: 'Name of the Recipe entity.',
    example: 'Blueberry Pie',
  })
  @IsString()
  @IsOptional()
  readonly recipeName?: string;

  @ApiPropertyOptional({
    description: 'Id of the MenuItem that the recipe produces.',
    example: 'Blueberry Pie',
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly producedMenuItemId?: number | null;

  @ApiPropertyOptional({
    description: 'If the recipe is used as an ingredient.(Not sold directly)',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  readonly isIngredient?: boolean;

  @ApiPropertyOptional({
    description:
      'The unit amount the recipe produces of the referenced BatchUnitOfMeasure UnitofMeasure entity.',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly batchResultQuantity?: number | null;

  @ApiPropertyOptional({
    description:
      'Id of the UnitofMeasure entity expressing the unit size of what the recipe produces.',
    example: 2,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly batchResultMeasurementId?: number | null;

  @ApiPropertyOptional({
    description:
      'The unit amount of the servingSizeUnitOfMeasure describing the amount that is sold.',
    example: 3,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly servingSizeQuantity?: number | null;

  @ApiPropertyOptional({
    description:
      'Id of the UnitofMeasure used to represent the unit size of what is sold.',
    example: 4,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly servingSizeMeasurementId?: number | null;

  @ApiPropertyOptional({
    description: 'The price of purchasing the serving size amount.',
    example: 5.99,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  readonly salesPrice?: number | null;

  @ApiPropertyOptional({
    description: 'Id of the RecipeCategory entity',
    example: 6,
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  readonly categoryId?: number | null;

  @ApiPropertyOptional({
    description:
      'Id of the RecipeSubCategory entity. Must be a child subcategory to the referenced RecipeCategory',
    example: 7,
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  readonly subCategoryId?: number | null;

  @ApiPropertyOptional({
    description:
      'Mixed array of CreateChildRecipeIngredientDtos and UpdateChildRecipeIngredientDtos. Child dtos are used when creating/updating child RecipeIngredient entites through updating the Recipe entity.',
    type: [NestedRecipeIngredientDto],
    example: [
      {
        mode: 'update',
        id: 1,
        updateDto: {
          ngredientInventoryItemId: 2,
          ingredientRecipeId: null,
          quantity: 3,
          quantityMeasurementId: 4,
        },
      },
      {
        mode: 'create',
        createDto: {
          ingredientInventoryItemId: null,
          ingredientRecipeId: 5,
          quantity: 6,
          quantityMeasurementId: 7,
        },
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  readonly ingredientDtos?: NestedRecipeIngredientDto[];
}
