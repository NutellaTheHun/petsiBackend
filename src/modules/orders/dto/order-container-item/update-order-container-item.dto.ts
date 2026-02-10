import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { EntityId } from '../../../../common/types';
import { MenuItemSize } from '../../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../../menu-items/entities/menu-item.entity';

export class UpdateOrderContainerItemDto {
    @ApiProperty({
        description:
            'Id of the MenuItem that is being ordered, requires parentMenuItemId_ctx and parentMenuItemSizeId_ctx to be populated',
        example: 2,
    })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    readonly containedMenuItemId: EntityId<MenuItem>;

    @ApiProperty({
        description:
            'Id of the MenuItemSize that is being ordered, must be a valid size to the containedMenuItem,  requires parentMenuItemId_ctx and parentMenuItemSizeId_ctx to be populated',
        example: 3,
    })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    readonly containedItemSizeId: EntityId<MenuItemSize>;

    @ApiProperty({
        description:
            'amount of the containedMenuItem / containedItemSize being ordered',
        example: 4,
    })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    readonly quantity: number;
}
