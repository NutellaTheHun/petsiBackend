import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
import { NestedOrderMenuItemDto } from '../order-menu-item/nested-order-menu-item.dto';

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

  @ApiPropertyOptional({
    description: 'Name of who is picking up the order or reciving the delivery',
    example: 'Jane Doe',
    nullable: true,
    type: 'string',
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

  @ApiPropertyOptional({
    description: 'for delivery contact information',
    example: '123 main st',
    nullable: true,
    type: 'string',
  })
  @IsString()
  @IsOptional()
  readonly deliveryAddress?: string;

  @ApiPropertyOptional({
    description: 'for delivery contact information',
    example: '1234568',
    nullable: true,
    type: 'string',
  })
  @IsString()
  @IsOptional()
  readonly phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'for delivery contact information',
    example: 'email@email.com',
    nullable: true,
    type: 'string',
    format: 'email',
  })
  @IsString()
  @IsOptional()
  readonly email?: string;

  @ApiPropertyOptional({
    description: 'special instruction for order',
    example: 'note information',
    nullable: true,
    type: 'string',
  })
  @IsString()
  @IsOptional()
  readonly note?: string;

  @ApiPropertyOptional({
    description:
      'A frozen order is inactive and is not included for typical buisness logic opeations. Not included in aggregates or reports.',
    example: false,
    nullable: true,
    type: 'boolean',
  })
  @IsBoolean()
  @IsOptional()
  readonly isFrozen?: boolean;

  @ApiPropertyOptional({
    description: 'Is true if the order occurs on a weekly basis.',
    example: true,
    nullable: true,
    type: 'boolean',
  })
  @IsBoolean()
  @IsOptional()
  readonly isWeekly?: boolean;

  @ApiPropertyOptional({
    description: 'If is weekly, is the day of the week the order is fulfilled',
    example: 'sunday',
    nullable: true,
    type: 'string',
  })
  @IsString()
  @IsOptional()
  readonly weeklyFulfillment?: string;

  @ApiProperty({
    description: 'An array of CreateOrderMenuItemDtos.',
    type: [NestedOrderMenuItemDto],
    example: [
      {
        mode: 'create',
        createDto: {
          menuItemId: 10,
          menuItemSizeId: 2,
          quantity: 3,
          orderedItemContainerDtos: [
            {
              parentContainerMenuItemId: 10,
              containedMenuItemId: 4,
              containedMenuItemSizeId: 5,
              quantity: 6,
            },
          ],
        },
      },
    ],
  })
  @IsArray()
  readonly orderedMenuItemDtos: NestedOrderMenuItemDto[];
}
