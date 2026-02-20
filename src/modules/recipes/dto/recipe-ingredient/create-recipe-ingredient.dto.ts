import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from 'class-validator';
import { EntityId } from '../../../../common/types';
import { InventoryItem } from '../../../inventory-items/entities/inventory-item.entity';
import { UnitOfMeasure } from '../../../unit-of-measure/entities/unit-of-measure.entity';
import { Recipe } from '../../entities/recipe.entity';

export class CreateRecipeIngredientDto {
    @ApiProperty({
        description:
            'Id of InventoryItem used as the ingredient, is optional. If inventoryItemId is null, subRecipeIngredientId must be populated, both cannot be populated.',
        example: 2,
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
        example: 3,
        type: 'number',
        nullable: true,
    })
    @IsOptional()
    @IsNumber()
    @IsPositive()
    readonly ingredientRecipeId?: EntityId<Recipe> | null;

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

    @ApiProperty({
        description:
            'Id of the Recipe entity that is the parent. Is required if sending DTO to recipe-ingredient endpoint. Is not required if sending DTO as a nested dto of a create recipe request.',
        example: 1,
    })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly parentRecipeId: EntityId<Recipe>;
}
