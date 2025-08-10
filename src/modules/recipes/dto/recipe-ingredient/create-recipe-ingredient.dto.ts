import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class CreateRecipeIngredientDto {
  @ApiProperty({
    description:
      'Id of the Recipe entity that is the parent. Is required if sending DTO to recipe-ingredient endpoint. Is not required if sending DTO as a nested dto of a create recipe request.',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly parentRecipeId?: number;

  @ApiPropertyOptional({
    description:
      'Id of InventoryItem used as the ingredient, is optional. If inventoryItemId is null, subRecipeIngredientId must be populated, both cannot be populated.',
    example: 2,
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly ingredientInventoryItemId?: number | null;

  @ApiPropertyOptional({
    description:
      'Id of Recipe entity being used as a recipe ingredient, is optional. If subRecipeIngredientId is null, inventoryItemId must be populated, both cannot be populated.',
    example: 3,
    nullable: true,
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
  @IsNotEmpty()
  readonly quantity: number;

  @ApiProperty({
    description: 'Id of the UnitofMeasure entity.',
    example: 5,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly quantityMeasurementId: number;
}
