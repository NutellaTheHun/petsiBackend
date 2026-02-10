import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { EntityId } from '../../../../common/types';
import { MenuItemSize } from '../../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../../menu-items/entities/menu-item.entity';
import { NestedCreateOrderContainerItemDto } from '../order-container-item/nested-create-order-container-item.dto';
import { NestedUpdateOrderContainerItemDto } from '../order-container-item/nested-update-order-container-item.dto';

export class UpdateOrderMenuItemDto {
    @ApiProperty({
        description: 'Id of MenuItem entity being ordered.',
        example: 1,
    })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    readonly menuItemId: EntityId<MenuItem>;

    @ApiProperty({
        description:
            'Id of the MenuItemSize entity. Must be valid size for the MenuItem being ordered.',
        example: 2,
    })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    readonly sizeId: EntityId<MenuItemSize>;

    @ApiProperty({ description: 'Amount being ordered.', example: 3 })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    readonly quantity: number;

    @ApiProperty({
        description:
            'Dtos when creating an OrderMenuItem entity that is a container for a list of MenuItem',
        type: 'array',
        oneOf: [
            { $ref: getSchemaPath(NestedCreateOrderContainerItemDto) },
            { $ref: getSchemaPath(NestedUpdateOrderContainerItemDto) },
        ],
        example: [
            {
                createId: 'c1',
                containedMenuItemId: 2,
                containedItemSizeId: 3,
                quantity: 4,
                parentMenuItemIdCtx: 5,
                parentMenuItemSizeIdCtx: 6,
            },
            {
                id: 7,
                containedMenuItemId: 8,
                containedItemSizeId: 9,
                quantity: 10,
                parentMenuItemIdCtx: 11,
                parentMenuItemSizeIdCtx: 12,
            },
        ],
    })
    @IsArray()
    @IsNotEmpty()
    readonly containerOrderMenuItems: (
        | NestedCreateOrderContainerItemDto
        | NestedUpdateOrderContainerItemDto
    )[];
}
