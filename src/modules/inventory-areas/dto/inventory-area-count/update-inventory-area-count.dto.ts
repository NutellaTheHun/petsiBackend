import {
    ApiProperty,
    getSchemaPath
} from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, ValidateNested } from 'class-validator';
import { EntityId } from '../../../../common/types';
import { InventoryArea } from '../../entities/inventory-area.entity';
import { NestedCreateInventoryAreaItemDto } from '../inventory-area-item/nested-create-inventory-area-item.dto';
import { NestedUpdateInventoryAreaItemDto } from '../inventory-area-item/nested-update-inventory-area-item.dto';

export class UpdateInventoryAreaCountDto {
    @ApiProperty({
        description: 'Id for Inventory-Area entity.',
        example: 1,
    })
    @IsNumber()
    @IsNotEmpty()
    readonly inventoryAreaId: EntityId<InventoryArea>;

    @ApiProperty({
        description: 'Counted InventoryItems for the InventoryAreaCount.',
        type: 'array',
        oneOf: [
            { $ref: getSchemaPath(NestedCreateInventoryAreaItemDto) },
            { $ref: getSchemaPath(NestedUpdateInventoryAreaItemDto) },
        ],
        example: [
            {
                id: 1,
                countedInventoryItemId: 4,
                amount: 5,
                countedItemSizeId: 6,
            },
            {
                createId: 'c4798',
                countedInventoryItemId: 7,
                amount: 8,
                countedItemSizeId: 9,
            },
        ],
    })
    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    readonly countedInventoryItems: (
        | NestedCreateInventoryAreaItemDto
        | NestedUpdateInventoryAreaItemDto
    )[];
}
