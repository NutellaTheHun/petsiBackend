import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { Order } from '../../entities/order.entity';

/**
 * Depreciated, only created as a child through {@link Order}.
 */
export class CreateOrderContainerItemDto {
  @ApiProperty({
    description:
      'Id of the OrderMenuItem that is the parent. Only used when creating through the OrderMenuItem endpoint, since the parent isnt assigned an Id yet.',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  readonly parentOrderMenuItemId?: number;

  @ApiProperty({
    description: "Id of the MenuItem that is this item's container",
    example: 2,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  readonly parentContainerMenuItemId: number;

  @ApiProperty({
    description: 'Id of the MenuItem that is being ordered',
    example: 3,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  readonly containedMenuItemId: number;

  @ApiProperty({
    description:
      'Id of the MenuItemSize that is being ordered, must be a valid size to the containedMenuItem',
    example: 4,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  readonly containedMenuItemSizeId: number;

  @ApiProperty({
    description:
      'amount of the containedMenuItem / containedItemSize being ordered',
    example: 5,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  readonly quantity: number;
}
