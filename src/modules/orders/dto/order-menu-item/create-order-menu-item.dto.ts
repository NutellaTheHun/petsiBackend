import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
} from 'class-validator';
import { Order } from '../../entities/order.entity';
import { CreateChildOrderContainerItemDto } from '../order-container-item/create-child-order-container-item.dto';
/**
 * Depreciated, only created as a child through {@link Order}.
 */
export class CreateOrderMenuItemDto {
  @ApiProperty({
    description: 'Id of Order entity the OrderMenuItem belongs to.',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  readonly orderId: number;

  @ApiProperty({
    description: 'Id of MenuItem entity being ordered.',
    example: 2,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  readonly menuItemId: number;

  @ApiProperty({
    description:
      'Id of the MenuItemSize entity. Must be valid size for the MenuItem being ordered.',
    example: 3,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  readonly menuItemSizeId: number;

  @ApiProperty({ description: 'Amount being ordered.' })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  readonly quantity: number;

  @ApiPropertyOptional({
    description:
      'Dtos when creating an OrderMenuItem entity that is a container for a list of MenuItem',
    type: [CreateChildOrderContainerItemDto],
    example: [
      {
        mode: 'create',
        parentContainerMenuItemId: 10,
        containedMenuItemId: 4,
        containedMenuItemSizeId: 5,
        quantity: 6,
      },
      {
        mode: 'create',
        parentContainerMenuItemId: 10,
        containedMenuItemId: 7,
        containedMenuItemSizeId: 8,
        quantity: 9,
      },
    ],
  })
  @IsArray()
  @IsOptional()
  readonly orderedItemContainerDtos?: CreateChildOrderContainerItemDto[];
}
