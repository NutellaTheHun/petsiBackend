import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class CreateChildRecipeIngredientDto {
  @ApiProperty({
    description:
      'Declare whether creating or updating a child entity. Relevant when creating/updating a Recipe entity.',
    example: 'create',
  })
  @IsNotEmpty()
  readonly mode: 'create' = 'create';

  @ApiProperty({
    description:
      'Id of InventoryItem used as the ingredient, is optional. If inventoryItemId is null, subRecipeIngredientId must be populated, both cannot be populated.',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly ingredientInventoryItemId?: number;

  @ApiProperty({
    description:
      'Id of Recipe entity being used as a recipe ingredient, is optional. If subRecipeIngredientId is null, inventoryItemId must be populated, both cannot be populated.',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly ingredientRecipeId?: number;

  @ApiProperty({
    description: 'The unit amount of the UnitofMeasure of the InventoryItem',
    example: 2,
  })
  @IsNumber()
  @IsNotEmpty()
  readonly quantity: number;

  @ApiProperty({
    description: 'Id of the UnitofMeasure entity.',
    example: 3,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly quantityMeasurementId: number;
}
