import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { NestedCreateDto } from '../../../../common/base/nested-create-dto.base';
import { EntityId } from '../../../../common/types';
import { MenuItemSize } from '../../entities/menu-item-size.entity';
import { MenuItem } from '../../entities/menu-item.entity';

export class NestedCreateMenuItemContainerItemDto extends NestedCreateDto {
    @ApiProperty({
        description:
            'Id of a MenuItem entity. Represents the contained MenuItem item.',
        example: 3,
    })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly containedMenuItemId: EntityId<MenuItem>;

    @ApiProperty({
        description: 'Id of a MenuItemSize entity. The size of the contained item',
        example: 4,
    })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly containedItemSizeId: EntityId<MenuItemSize>;

    @ApiProperty({
        description: 'The amount of MenuItem/MenuItemSize combination',
        example: 5,
    })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly quantity: number;

    @ApiProperty({
        description: 'Id of a MenuItemSize entity of the parent container',
        example: 6,
    })
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    readonly parentItemSizeId: EntityId<MenuItemSize>;
}
