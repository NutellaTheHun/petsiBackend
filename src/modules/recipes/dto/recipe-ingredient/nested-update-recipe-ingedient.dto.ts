import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  ValidateNested,
} from 'class-validator';
import { UpdateRecipeIngredientDto } from './update-recipe-ingedient.dto';

export class NestedUpdateRecipeIngredientDto {
  @ApiProperty({
    description: 'Id of the RecipeIngredient entity.',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly id: number;

  @ApiProperty({
    description: 'Update dto of a RecipeIngredient entity.',
    type: UpdateRecipeIngredientDto,
    example: {
      ingredientInventoryItemId: 2,
      ingredientRecipeId: null,
      quantity: 3,
      quantityMeasurementId: 4,
    },
  })
  @ValidateNested()
  @Type(() => UpdateRecipeIngredientDto)
  readonly dto: UpdateRecipeIngredientDto;
}
