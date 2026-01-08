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
import { EntityId } from '../../../../common/types';
import { MenuItem } from '../../../menu-items/entities/menu-item.entity';
import { UnitOfMeasure } from '../../../unit-of-measure/entities/unit-of-measure.entity';
import { RecipeCategory } from '../../entities/recipe-category.entity';
import { RecipeSubCategory } from '../../entities/recipe-sub-category.entity';
import { NestedCreateRecipeIngredientDto } from '../recipe-ingredient/nested-create-recipe-ingredient.dto';

export class CreateRecipeDto {
  @ApiProperty({
    description: 'Name of the Recipe entity.',
    example: 'Blueberry Pie',
  })
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @ApiPropertyOptional({
    description: 'Id of the MenuItem that the recipe produces.',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly producedMenuItemId?: EntityId<MenuItem>;

  @ApiPropertyOptional({
    description:
      'The unit amount the recipe produces of the referenced BatchUnitOfMeasure UnitofMeasure entity.',
    example: 2,
    type: 'number',
    format: 'decimal',
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly batchResultQuantity?: number;

  @ApiProperty({
    description:
      'Id of the UnitofMeasure entity expressing the unit size of what the recipe produces.',
    example: 3,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly batchResultUnitTypeId: EntityId<UnitOfMeasure>;

  @ApiPropertyOptional({
    description:
      'The unit amount of the servingSizeUnitOfMeasure describing the amount that is sold.',
    example: 4,
    type: 'number',
    format: 'decimal',
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly servingSizeQuantity?: number;

  @ApiProperty({
    description:
      'Id of the UnitofMeasure used to represent the unit size of what is sold.',
    example: 5,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly servingSizeUnitTypeId: EntityId<UnitOfMeasure>;

  @ApiPropertyOptional({
    description: 'The price of purchasing the serving size amount.',
    example: 6,
    type: 'number',
    format: 'decimal',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  readonly salesPrice?: number;

  @ApiPropertyOptional({
    description: 'If the recipe is used as an ingredient.(Not sold directly)',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  readonly isIngredient: boolean;

  @ApiPropertyOptional({
    description: 'Id of the RecipeCategory entity',
    example: 7,
    type: 'number',
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  readonly categoryId?: EntityId<RecipeCategory>;

  @ApiPropertyOptional({
    description:
      'Id of the RecipeSubCategory entity. Must be a child subcategory to the referenced RecipeCategory',
    example: 8,
    type: 'number',
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  readonly subCategoryId?: EntityId<RecipeSubCategory>;

  @ApiPropertyOptional({
    description: 'Array of CreateRecipeIngredientDto.',
    type: [NestedCreateRecipeIngredientDto],
    example: [
      {
        createId: 'c1',
        ingredientInventoryItemId: 2,
        quantity: 3,
        quantityUnitTypeId: 4,
      },
      {
        createId: 'c5',
        ingredientRecipeId: 5,
        quantity: 6,
        quantityUnitTypeId: 7,
      },
    ],
  })
  @IsOptional()
  @IsArray()
  readonly ingredients?: NestedCreateRecipeIngredientDto[];
}
