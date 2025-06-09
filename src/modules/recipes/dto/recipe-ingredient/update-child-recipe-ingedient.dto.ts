import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class UpdateChildRecipeIngredientDto {
  @ApiProperty({
    description:
      'Declare whether creating or updating a child entity. Relevant when creating/updating a Recipe entity.',
    example: 'update',
  })
  @IsNotEmpty()
  readonly mode: 'update' = 'update';

  @ApiProperty({
    description: 'Id of the RecipeIngredient to update',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly id: number;

  @ApiProperty({
    description:
      'Id of InventoryItem used as the ingredient, is optional. If inventoryItemId is null, subRecipeIngredientId must be populated, both cannot be populated.',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly ingredientInventoryItemId?: number | null;

  @ApiProperty({
    description:
      'Id of Recipe entity being used as a recipe ingredient, is optional. If subRecipeIngredientId is null, inventoryItemId must be populated, both cannot be populated.',
    example: 3,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly ingredientRecipeId?: number | null;

  @ApiProperty({
    description: 'The unit amount of the UnitofMeasure of the InventoryItem',
    example: 4,
  })
  @IsNumber()
  @IsOptional()
  readonly quantity?: number;

  @ApiProperty({
    description: 'Id of the UnitofMeasure entity.',
    example: 5,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly quantityMeasurementId?: number;
}
