import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from 'class-validator';
import { NestedUpdateDto } from '../../../../common/base/nested-update-dto.base';
import { EntityId } from '../../../../common/types';
import { InventoryItem } from '../../../inventory-items/entities/inventory-item.entity';
import { UnitOfMeasure } from '../../../unit-of-measure/entities/unit-of-measure.entity';
import { Recipe } from '../../entities/recipe.entity';

export class NestedUpdateRecipeIngredientDto extends NestedUpdateDto {
    @ApiProperty({
        description:
            'Id of InventoryItem used as the ingredient, is optional. If inventoryItemId is null, subRecipeIngredientId must be populated, both cannot be populated.',
        example: 3,
        type: 'number',
        nullable: true,
    })
    @IsOptional()
    @IsNumber()
    @IsPositive()
    readonly ingredientInventoryItemId?: EntityId<InventoryItem> | null;

    @ApiProperty({
        description:
            'Id of Recipe entity being used as a recipe ingredient, is optional. If subRecipeIngredientId is null, inventoryItemId must be populated, both cannot be populated.',
        example: 4,
        type: 'number',
        nullable: true,
    })
    @IsOptional()
    @IsNumber()
    @IsPositive()
    readonly ingredientRecipeId?: EntityId<Recipe> | null;

    @ApiProperty({
        description: 'The unit amount of the UnitofMeasure of the InventoryItem',
        example: 1,
    })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    readonly quantity: number;

    @ApiProperty({
        description: 'Id of the UnitofMeasure entity.',
        example: 2,
    })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly quantityUnitTypeId: EntityId<UnitOfMeasure>;
}
