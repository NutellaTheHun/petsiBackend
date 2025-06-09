import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';

export class UpdateRecipeIngredientDto {
  @ApiProperty({
    description: 'The unit amount of the UnitofMeasure of the InventoryItem',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  readonly quantity?: number;

  @ApiProperty({
    description: 'Id of the UnitofMeasure entity.',
    example: 2,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly quantityMeasurementId?: number;

  @ApiProperty({
    description:
      'Id of InventoryItem used as the ingredient, is optional. If inventoryItemId is null, subRecipeIngredientId must be populated, both cannot be populated.',
    example: 3,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly ingredientInventoryItemId?: number | null;

  @ApiProperty({
    description:
      'Id of Recipe entity being used as a recipe ingredient, is optional. If subRecipeIngredientId is null, inventoryItemId must be populated, both cannot be populated.',
    example: 4,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly ingredientRecipeId?: number | null;
}
