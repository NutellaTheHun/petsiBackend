import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { NestedUpdateDto } from '../../../../common/base/nested-update-dto.base';
import { EntityId } from '../../../../common/types';
import { MenuItemSize } from '../../entities/menu-item-size.entity';
import { MenuItem } from '../../entities/menu-item.entity';

export class NestedUpdateMenuItemContainerItemDto extends NestedUpdateDto {
    @ApiProperty({
        description: 'Id of a MenuItem entity. Represents the contained item.',
        example: 1,
    })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly containedMenuItemId: EntityId<MenuItem>;

    @ApiProperty({
        description: 'Id of a MenuItemSize entity. The size of the contained item',
        example: 2,
    })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly containedItemSizeId: EntityId<MenuItemSize>;

    @ApiProperty({
        description: 'The amount of MenuItem/MenuItemSize combination',
        example: 3,
    })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly quantity: number;
}
