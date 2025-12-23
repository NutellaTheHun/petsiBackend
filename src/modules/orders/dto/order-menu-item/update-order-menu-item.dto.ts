import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsPositive } from 'class-validator';
import { EntityId } from '../../../../common/types';
import { MenuItemSize } from '../../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../../menu-items/menu-items.module';
import { NestedOrderContainerItemDto } from '../order-container-item/nested-order-container-item.dto';

export class UpdateOrderMenuItemDto {
  @ApiPropertyOptional({
    description: 'Id of MenuItem entity being ordered.',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  readonly menuItemId?: EntityId<MenuItem>;

  @ApiPropertyOptional({
    description:
      'Id of the MenuItemSize entity. Must be valid size for the MenuItem being ordered.',
    example: 2,
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  readonly sizeId?: EntityId<MenuItemSize>;

  @ApiPropertyOptional({ description: 'Amount being ordered.', example: 3 })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  readonly quantity?: number;

  @ApiPropertyOptional({
    description:
      'Dtos when creating an OrderMenuItem entity that is a container for a list of MenuItem',
    type: [NestedOrderContainerItemDto],
    example: [
      {
        mode: 'create',
        createId: 'c1',
        createDto: {
          containedMenuItemId: 2,
          containedItemSizeId: 3,
          quantity: 4,
          parentMenuItemIdCtx: 5,
          parentMenuItemSizeIdCtx: 6,
        },
      },
      {
        mode: 'update',
        id: 7,
        updateDto: {
          containedMenuItemId: 8,
          containedItemSizeId: 9,
          quantity: 10,
          parentMenuItemIdCtx: 11,
          parentMenuItemSizeIdCtx: 12,
        },
      },
    ],
  })
  @IsArray()
  @IsOptional()
  readonly containerOrderMenuItems?: NestedOrderContainerItemDto[];
}
