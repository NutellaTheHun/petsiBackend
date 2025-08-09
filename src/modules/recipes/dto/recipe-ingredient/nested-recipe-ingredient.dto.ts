import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { CreateRecipeIngredientDto } from './create-recipe-ingredient.dto';
import { UpdateRecipeIngredientDto } from './update-recipe-ingedient.dto';

export class NestedRecipeIngredientDto {
  @ApiProperty({
    description: 'Determines if this dto is to update or create a resource',
    example: 'create',
    enum: ['create', 'update'],
  })
  @IsNotEmpty()
  readonly mode: 'create' | 'update';

  @ApiPropertyOptional({
    description: 'Id for RecipeIngredient entity when updating',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  readonly id?: number;

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
