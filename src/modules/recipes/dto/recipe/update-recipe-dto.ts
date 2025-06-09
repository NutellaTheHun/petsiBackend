import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
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
import { RecipeIngredientUnionResolver } from '../../utils/recipe-ingredient-union-resolver';
import { CreateChildRecipeIngredientDto } from '../recipe-ingredient/create-child-recipe-ingredient.dto';
import { UpdateChildRecipeIngredientDto } from '../recipe-ingredient/update-child-recipe-ingedient.dto';

export class UpdateRecipeDto {
  @ApiProperty({
    description: 'Name of the Recipe entity.',
    example: 'Blueberry Pie',
  })
  @IsString()
  @IsOptional()
  readonly recipeName?: string;

  @ApiProperty({
    description: 'Id of the MenuItem that the recipe produces.',
    example: 'Blueberry Pie',
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly producedMenuItemId?: number | null;

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
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly batchResultQuantity?: number | null;

  @ApiProperty({
    description:
      'Id of the UnitofMeasure entity expressing the unit size of what the recipe produces.',
    example: 2,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly batchResultMeasurementId?: number | null;

  @ApiProperty({
    description:
      'The unit amount of the servingSizeUnitOfMeasure describing the amount that is sold.',
    example: 3,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly servingSizeQuantity?: number | null;

  @ApiProperty({
    description:
      'Id of the UnitofMeasure used to represent the unit size of what is sold.',
    example: 4,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly servingSizeMeasurementId?: number | null;

  @ApiProperty({
    description: 'The price of purchasing the serving size amount.',
    example: 5.99,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  readonly salesPrice?: number | null;

  @ApiProperty({
    description: 'Id of the RecipeCategory entity',
    example: 6,
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  readonly categoryId?: number | null;

  @ApiProperty({
    description:
      'Id of the RecipeSubCategory entity. Must be a child subcategory to the referenced RecipeCategory',
    example: 7,
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  readonly subCategoryId?: number | null;

  @ApiProperty({
    description:
      'Mixed array of CreateChildRecipeIngredientDtos and UpdateChildRecipeIngredientDtos. Child dtos are used when creating/updating child RecipeIngredient entites through updating the Recipe entity.',
    type: [UpdateChildRecipeIngredientDto],
    example: [
      {
        mode: 'update',
        id: 1,
        ingredientInventoryItemId: 2,
        ingredientRecipeId: null,
        quantity: 3,
        quantityMeasurementId: 4,
      },
      {
        mode: 'create',
        ingredientInventoryItemId: null,
        ingredientRecipeId: 5,
        quantity: 6,
        quantityMeasurementId: 7,
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientUnionResolver)
  readonly ingredientDtos?: (
    | CreateChildRecipeIngredientDto
    | UpdateChildRecipeIngredientDto
  )[];
}
