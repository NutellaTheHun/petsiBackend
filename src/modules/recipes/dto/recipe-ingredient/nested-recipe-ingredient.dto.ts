import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { CreateRecipeIngredientDto } from './create-recipe-ingredient.dto';
import { NestedUpdateRecipeIngredientDto } from './nested-update-recipe-ingedient.dto';
import { UpdateRecipeIngredientDto } from './update-recipe-ingedient.dto';

export class NestedRecipeIngredientDto {
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
  create?: CreateRecipeIngredientDto;

  @ApiPropertyOptional({
    description: 'Update dto of a RecipeIngredient entity.',
    type: UpdateRecipeIngredientDto,
    example: {
      id: 1,
      dto: {
        ingredientInventoryItemId: 2,
        ingredientRecipeId: null,
        quantity: 3,
        quantityMeasurementId: 4,
      },
    },
  })
  @ValidateNested()
  @Type(() => NestedUpdateRecipeIngredientDto)
  update?: NestedUpdateRecipeIngredientDto;
}
