import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsPositive } from 'class-validator';
import { NestedCreateDto } from '../../../../common/base/nested-create-dto.base';
import { AppUnit, UNITS } from '../../../../common/units';
import { EntityId } from '../../../../common/types';
import { InventoryItem } from '../../../inventory-items/entities/inventory-item.entity';
import { Recipe } from '../../entities/recipe.entity';

export class NestedCreateRecipeIngredientDto extends NestedCreateDto {
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
        description: 'The unit amount of the unit of measure of the InventoryItem',
        example: 4,
    })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly quantity: number;

    @ApiProperty({
        description: 'Unit symbol for the ingredient quantity (e.g. "kg", "cup", "ea").',
        example: 'oz',
    })
    @IsIn(Object.values(UNITS))
    @IsNotEmpty()
    readonly unit: AppUnit;
}
