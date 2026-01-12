import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from 'class-validator';
import { NestedCreateDto } from '../../../../common/base/nested-create-dto.base';
import { EntityId } from '../../../../common/types';
import { InventoryItem } from '../../../inventory-items/entities/inventory-item.entity';
import { UnitOfMeasure } from '../../../unit-of-measure/entities/unit-of-measure.entity';
import { Recipe } from '../../entities/recipe.entity';

export class NestedCreateRecipeIngredientDto extends NestedCreateDto {
  @ApiPropertyOptional({
    description:
      'Id of InventoryItem used as the ingredient, is optional. If inventoryItemId is null, subRecipeIngredientId must be populated, both cannot be populated.',
    example: 2,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly ingredientInventoryItemId?: EntityId<InventoryItem>;

  @ApiPropertyOptional({
    description:
      'Id of Recipe entity being used as a recipe ingredient, is optional. If subRecipeIngredientId is null, inventoryItemId must be populated, both cannot be populated.',
    example: 3,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly ingredientRecipeId?: EntityId<Recipe>;

  @ApiProperty({
    description: 'The unit amount of the UnitofMeasure of the InventoryItem',
    example: 4,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly quantity: number;

  @ApiProperty({
    description: 'Id of the UnitofMeasure entity.',
    example: 5,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly quantityUnitTypeId: EntityId<UnitOfMeasure>;
}
