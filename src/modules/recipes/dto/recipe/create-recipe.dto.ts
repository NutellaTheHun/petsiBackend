import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
import { CreateRecipeIngredientDto } from '../recipe-ingredient/create-recipe-ingredient.dto';

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
    type: Number,
    nullable: true,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly producedMenuItemId?: number | null;

  @ApiPropertyOptional({
    description: 'If the recipe is used as an ingredient.(Not sold directly)',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  readonly isIngredient: boolean;

  @ApiPropertyOptional({
    description:
      'The unit amount the recipe produces of the referenced BatchUnitOfMeasure UnitofMeasure entity.',
    example: 2,
    type: 'number',
    format: 'decimal',
    nullable: true,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly batchResultQuantity?: number | null;

  @ApiProperty({
    description:
      'Id of the UnitofMeasure entity expressing the unit size of what the recipe produces.',
    example: 3,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly batchResultMeasurementId: number;

  @ApiPropertyOptional({
    description:
      'The unit amount of the servingSizeUnitOfMeasure describing the amount that is sold.',
    example: 4,
    type: 'number',
    format: 'decimal',
    nullable: true,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly servingSizeQuantity?: number | null;

  @ApiProperty({
    description:
      'Id of the UnitofMeasure used to represent the unit size of what is sold.',
    example: 5,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly servingSizeMeasurementId: number;

  @ApiPropertyOptional({
    description: 'The price of purchasing the serving size amount.',
    example: 6,
    type: 'number',
    format: 'decimal',
    nullable: true,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  readonly salesPrice?: number | null;

  @ApiPropertyOptional({
    description: 'Id of the RecipeCategory entity',
    example: 7,
    nullable: true,
    type: 'number',
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  readonly categoryId?: number | null;

  @ApiPropertyOptional({
    description:
      'Id of the RecipeSubCategory entity. Must be a child subcategory to the referenced RecipeCategory',
    example: 8,
    nullable: true,
    type: 'number',
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  readonly subCategoryId?: number | null;

  @ApiPropertyOptional({
    description: 'Array of CreateRecipeIngredientDto.',
    type: [CreateRecipeIngredientDto],
    example: [
      {
        ingredientInventoryItemId: 1,
        ingredientRecipeId: null,
        quantity: 2,
        quantityMeasurementId: 3,
      },
      {
        ingredientInventoryItemId: null,
        ingredientRecipeId: 4,
        quantity: 5,
        quantityMeasurementId: 6,
      },
    ],
  })
  @IsOptional()
  @IsArray()
  readonly ingredientDtos?: CreateRecipeIngredientDto[];
}
