import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { EntityId } from '../../../../common/types';
import { NestedCreateInventoryItemSizeDto } from '../../../inventory-items/dto/inventory-item-size/nested-create-inventory-item-size.dto';
import { NestedUpdateInventoryItemSizeDto } from '../../../inventory-items/dto/inventory-item-size/nested-update-inventory-item-size.dto';
import { InventoryItemSize } from '../../../inventory-items/entities/inventory-item-size.entity';
import { InventoryItem } from '../../../inventory-items/entities/inventory-item.entity';

export class UpdateInventoryAreaItemDto {
    @ApiProperty({
        description: 'Id for InventoryItem entity.',
        example: 1,
        type: Number,
    })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly countedInventoryItemId: EntityId<InventoryItem>;

    @ApiProperty({
        description: 'The amount of InventoryItem per unit.',
        example: 6,
    })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly amount: number;

    @ApiProperty({
        description:
            'Id for InventoryItemSize entity. If countedItemSizeId is populated, countedItemSizeDto must be null/undefined.',
        example: 2,
        type: Number,
    })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly countedItemSizeId: EntityId<InventoryItemSize>;

    @ApiProperty({
        description:
            'If countedItemSizeDto is populated, countedItemSizeId must be null/undefined.',
        oneOf: [
            { $ref: getSchemaPath(NestedCreateInventoryItemSizeDto) },
            { $ref: getSchemaPath(NestedUpdateInventoryItemSizeDto) },
        ],
        example: {
            id: 5,
            measureTypeId: 1,
            measureAmount: 2,
            packageId: 3,
            cost: 4,
        },
    })
    @IsNotEmpty()
    readonly countedItemSize:
        | NestedCreateInventoryItemSizeDto
        | NestedUpdateInventoryItemSizeDto;
}
