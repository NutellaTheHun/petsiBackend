import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { EntityId } from '../../../../common/types';
import { MenuItemSize } from '../../../menu-items/entities/menu-item-size.entity';
import { MenuItem } from '../../../menu-items/menu-items.module';
import { OrderMenuItem } from '../../entities/order-menu-item.entity';

export class CreateOrderContainerItemDto {
  @ApiProperty({
    description: 'Id of the MenuItem that is being ordered',
    example: 3,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  readonly containedMenuItemId: EntityId<MenuItem>;

  @ApiProperty({
    description:
      'Id of the MenuItemSize that is being ordered, must be a valid size to the containedMenuItem',
    example: 4,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  readonly containedItemSizeId: EntityId<MenuItemSize>;

  @ApiProperty({
    description:
      'amount of the containedMenuItem / containedItemSize being ordered',
    example: 5,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  readonly quantity: number;

  @ApiPropertyOptional({
    description:
      'Id of the OrderMenuItem that is the parent. Only used when creating through the OrderMenuItem endpoint, since the parent isnt assigned an Id yet.',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  readonly parentOrderMenuItemId?: EntityId<OrderMenuItem>;

  @ApiProperty({
    description:
      "Id of the MenuItem that is this item's container, ctx denotes it is used to assist in creating the entity, but is not a mapped property",
    example: 2,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  readonly parentMenuItemIdCtx: EntityId<MenuItem>;

  @ApiProperty({
    description:
      "Id of the MenuItemSize of the Menuitem that is this item's container, ctx denotes it is used to assist in creating the entity, but is not a mapped property",
    example: 2,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  readonly parentMenuItemSizeIdCtx: EntityId<MenuItemSize>;
}
