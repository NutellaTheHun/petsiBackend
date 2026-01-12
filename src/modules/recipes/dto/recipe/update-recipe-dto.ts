import { ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
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
import { EntityId } from '../../../../common/types';
import { MenuItem } from '../../../menu-items/menu-items.module';
import { UnitOfMeasure } from '../../../unit-of-measure/entities/unit-of-measure.entity';
import { RecipeCategory } from '../../entities/recipe-category.entity';
import { RecipeSubCategory } from '../../entities/recipe-sub-category.entity';
import { NestedCreateRecipeIngredientDto } from '../recipe-ingredient/nested-create-recipe-ingredient.dto';
import { NestedUpdateRecipeIngredientDto } from '../recipe-ingredient/nested-update-recipe-ingedient.dto';

export class UpdateRecipeDto {
  @ApiPropertyOptional({
    description: 'Name of the Recipe entity.',
    example: 'Blueberry Pie',
  })
  @IsString()
  @IsOptional()
  readonly name?: string;

  @ApiPropertyOptional({
    description: 'Id of the MenuItem that the recipe produces.',
    example: 'Blueberry Pie',
    type: 'number',
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly producedMenuItemId?: EntityId<MenuItem>;

  @ApiPropertyOptional({
    description:
      'The unit amount the recipe produces of the referenced BatchUnitOfMeasure UnitofMeasure entity.',
    example: 1,
    type: 'number',
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly batchResultQuantity?: number;

  @ApiPropertyOptional({
    description:
      'Id of the UnitofMeasure entity expressing the unit size of what the recipe produces.',
    example: 2,
    type: 'number',
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly batchResultUnitTypeId?: EntityId<UnitOfMeasure>;

  @ApiPropertyOptional({
    description:
      'The unit amount of the servingSizeUnitOfMeasure describing the amount that is sold.',
    example: 3,
    type: 'number',
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly servingSizeQuantity?: number;

  @ApiPropertyOptional({
    description:
      'Id of the UnitofMeasure used to represent the unit size of what is sold.',
    example: 4,
    type: 'number',
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly servingSizeUnitTypeId?: EntityId<UnitOfMeasure>;

  @ApiPropertyOptional({
    description: 'The price of purchasing the serving size amount.',
    example: 5.99,
    type: 'number',
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  readonly salesPrice?: number;

  @ApiPropertyOptional({
    description: 'If the recipe is used as an ingredient.(Not sold directly)',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  readonly isIngredient?: boolean;

  @ApiPropertyOptional({
    description: 'Id of the RecipeCategory entity',
    example: 6,
    type: 'number',
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  readonly categoryId?: EntityId<RecipeCategory>;

  @ApiPropertyOptional({
    description:
      'Id of the RecipeSubCategory entity. Must be a child subcategory to the referenced RecipeCategory',
    example: 7,
    type: 'number',
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  readonly subCategoryId?: EntityId<RecipeSubCategory>;

  @ApiPropertyOptional({
    description: 'TODO',
    type: 'array',
    oneOf: [
      { $ref: getSchemaPath(NestedCreateRecipeIngredientDto) },
      { $ref: getSchemaPath(NestedUpdateRecipeIngredientDto) },
    ],
    example: [
      {
        id: 1,
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
  @ValidateNested({ each: true })
  readonly ingredients?: (
    | NestedCreateRecipeIngredientDto
    | NestedUpdateRecipeIngredientDto
  )[];
}
