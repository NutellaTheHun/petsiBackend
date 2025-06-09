import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { CreateChildOrderMenuItemDto } from '../order-menu-item/create-child-order-menu-item.dto';

export class CreateOrderDto {
  @ApiProperty({
    example: 1,
    description: 'Id of OrderType entity.',
  })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  readonly orderCategoryId: number;

  @ApiProperty({
    description: 'Name of the owner of the order',
    example: 'John Smith',
  })
  @IsString()
  @IsNotEmpty()
  readonly recipient: string;

  @ApiProperty({
    description: 'Name of who is picking up the order or reciving the delivery',
    example: 'Jane Doe',
  })
  @IsString()
  @IsOptional()
  readonly fulfillmentContactName?: string;

  @ApiProperty({
    description: 'Date the order is to be available or delivered.',
    example: '2025-06-08T20:26:45.883Z',
  })
  @IsDate()
  @IsNotEmpty()
  readonly fulfillmentDate: Date;

  @ApiProperty({
    description: "Method of Order's dispersal.",
    example: 'delivery',
  })
  @IsString()
  @IsNotEmpty()
  readonly fulfillmentType: string;

  @ApiProperty({
    description: 'for delivery contact information',
    example: '123 main st',
  })
  @IsString()
  @IsOptional()
  readonly deliveryAddress?: string;

  @ApiProperty({
    description: 'for delivery contact information',
    example: '1234568',
  })
  @IsString()
  @IsOptional()
  readonly phoneNumber?: string;

  @ApiProperty({
    description: 'for delivery contact information',
    example: 'email@email.com',
  })
  @IsString()
  @IsOptional()
  readonly email?: string;

  @ApiProperty({
    description: 'special instruction for order',
    example: 'note information',
  })
  @IsString()
  @IsOptional()
  readonly note?: string;

  @ApiProperty({
    description:
      'A frozen order is inactive and is not included for typical buisness logic opeations. Not included in aggregates or reports.',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  readonly isFrozen?: boolean;

  @ApiProperty({
    description: 'Is true if the order occurs on a weekly basis.',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  readonly isWeekly?: boolean;

  @ApiProperty({
    description: 'If is weekly, is the day of the week the order is fulfilled',
    example: 'sunday',
  })
  @IsString()
  @IsOptional()
  readonly weeklyFulfillment?: string;

  @ApiProperty({
    description:
      'An array of CreateChildOrderMenuItemDtos. Child dtos are used when creating an Order entity with child entites.',
    type: [CreateChildOrderMenuItemDto],
    example: [
      {
        mode: 'create',
        menuItemId: 10,
        menuItemSizeId: 2,
        quantity: 3,
        orderedItemContainerDtos: [
          {
            mode: 'create',
            parentContainerMenuItemId: 10,
            containedMenuItemId: 4,
            containedMenuItemSizeId: 5,
            quantity: 6,
          },
        ],
      },
    ],
  })
  @IsArray()
  orderedMenuItemDtos: CreateChildOrderMenuItemDto[];
}
