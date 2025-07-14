import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
} from 'class-validator';
import { CreateOrderContainerItemDto } from '../order-container-item/create-order-container-item.dto';

export class CreateOrderMenuItemDto {
  @ApiProperty({
    description:
      'Id of Order entity the OrderMenuItem belongs to. Is required if sending DTO to order-menu-item endpoint. Is not required if sending DTO as a nested dto of a create order request.',
    example: 1,
    required: false,
    nullable: true,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  readonly orderId?: number;

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
    type: [CreateOrderContainerItemDto],
    example: [
      {
        parentContainerMenuItemId: 10,
        containedMenuItemId: 4,
        containedMenuItemSizeId: 5,
        quantity: 6,
      },
      {
        parentContainerMenuItemId: 10,
        containedMenuItemId: 7,
        containedMenuItemSizeId: 8,
        quantity: 9,
      },
    ],
  })
  @IsArray()
  @IsOptional()
  readonly orderedItemContainerDtos?: CreateOrderContainerItemDto[];
}
