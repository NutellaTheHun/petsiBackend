import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { NestedDtoBase } from '../../../../base/nested-dto-base';
import { CreateRecipeIngredientDto } from './create-recipe-ingredient.dto';
import { UpdateRecipeIngredientDto } from './update-recipe-ingedient.dto';

export class NestedRecipeIngredientDto extends NestedDtoBase {
  @ApiPropertyOptional({
    description: 'Create dto of a RecipeIngredient entity.',
    type: CreateRecipeIngredientDto,
    example: {
      ingredientInventoryItemId: 1,
      ingredientRecipeId: null,
      quantity: 2,
      quantityMeasurementId: 3,
    },
  })
  @ValidateNested()
  @Type(() => CreateRecipeIngredientDto)
  createDto?: CreateRecipeIngredientDto;

  @ApiPropertyOptional({
    description: 'Update dto of a RecipeIngredient entity.',
    type: UpdateRecipeIngredientDto,
    example: {
      quantity: 1,
      quantityMeasurementId: 2,
      ingredientInventoryItemId: null,
      ingredientRecipeId: 4,
    },
  })
  @ValidateNested()
  @Type(() => UpdateRecipeIngredientDto)
  updateDto?: UpdateRecipeIngredientDto;
}
