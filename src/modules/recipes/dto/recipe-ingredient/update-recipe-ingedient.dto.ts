import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';
import { EntityId } from '../../../../common/types';
import { InventoryItem } from '../../../inventory-items/entities/inventory-item.entity';
import { UnitOfMeasure } from '../../../unit-of-measure/entities/unit-of-measure.entity';
import { Recipe } from '../../entities/recipe.entity';

export class UpdateRecipeIngredientDto {
  @ApiPropertyOptional({
    description:
      'Id of InventoryItem used as the ingredient, is optional. If inventoryItemId is null, subRecipeIngredientId must be populated, both cannot be populated.',
    example: 3,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly ingredientInventoryItemId?: EntityId<InventoryItem>;

  @ApiPropertyOptional({
    description:
      'Id of Recipe entity being used as a recipe ingredient, is optional. If subRecipeIngredientId is null, inventoryItemId must be populated, both cannot be populated.',
    example: 4,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly ingredientRecipeId?: EntityId<Recipe>;

  @ApiPropertyOptional({
    description: 'The unit amount of the UnitofMeasure of the InventoryItem',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  readonly quantity?: number;

  @ApiPropertyOptional({
    description: 'Id of the UnitofMeasure entity.',
    example: 2,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly quantityUnitTypeId?: EntityId<UnitOfMeasure>;
}
