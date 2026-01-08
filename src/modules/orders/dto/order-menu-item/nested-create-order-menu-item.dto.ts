import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
} from 'class-validator';
import { NestedCreate } from '../../../../common/base/nested-create.base';
import { EntityId } from '../../../../common/types';
import { MenuItemSize } from '../../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../../menu-items/menu-items.module';
import { NestedCreateOrderContainerItemDto } from '../order-container-item/nested-create-order-container-item.dto';

export class NestedCreateOrderMenuItemDto extends NestedCreate {
  @ApiProperty({
    description: 'Id of MenuItem entity being ordered.',
    example: 2,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  readonly menuItemId: EntityId<MenuItem>;

  @ApiProperty({
    description:
      'Id of the MenuItemSize entity. Must be valid size for the MenuItem being ordered.',
    example: 3,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  readonly sizeId: EntityId<MenuItemSize>;

  @ApiProperty({ description: 'Amount being ordered.' })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  readonly quantity: number;

  @ApiPropertyOptional({
    description:
      'Dtos when creating an OrderMenuItem entity that is a container for a list of MenuItem',
    type: [NestedCreateOrderContainerItemDto],
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
        createId: 'c7',
        containedMenuItemId: 8,
        containedItemSizeId: 9,
        quantity: 10,
        parentMenuItemIdCtx: 11,
        parentMenuItemSizeIdCtx: 12,
      },
    ],
  })
  @IsArray()
  @IsOptional()
  readonly containerOrderMenuItems?: NestedCreateOrderContainerItemDto[];
}
