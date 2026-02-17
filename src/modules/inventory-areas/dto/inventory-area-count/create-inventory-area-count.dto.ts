import { ApiProperty } from '@nestjs/swagger';
import {
    IsArray,
    IsNotEmpty,
    IsNumber,
    ValidateNested
} from 'class-validator';
import { EntityId } from '../../../../common/types';
import { InventoryArea } from '../../entities/inventory-area.entity';
import { NestedCreateInventoryAreaItemDto } from '../inventory-area-item/nested-create-inventory-area-item.dto';

export class CreateInventoryAreaCountDto {
    @ApiProperty({
        description: 'Id for InventoryArea entity.',
        example: 1,
    })
    @IsNumber()
    @IsNotEmpty()
    readonly inventoryAreaId: EntityId<InventoryArea>;

    @ApiProperty({
        description: 'Counted InventoryItems for the InventoryAreaCount.',
        type: [NestedCreateInventoryAreaItemDto],
        example: [
            {
                createId: 'c132',
                countedInventoryItemId: 1,
                amount: 2,
                parentInventoryCountId: 3,
                countedItemSizeDto: {
                    createId: 'c5325',
                    inventoryItemId: 4,
                    measureTypeId: 5,
                    measureAmount: 6,
                    packageId: 7,
                    cost: 8.99,
                },
            },
        ],
    })
    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    readonly countedInventoryItems: NestedCreateInventoryAreaItemDto[];
}
