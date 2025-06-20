import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';
import { OrderMenuItemUnionResolver } from '../../utils/order-menu-item-union-resolver';
import { CreateChildOrderMenuItemDto } from '../order-menu-item/create-child-order-menu-item.dto';
import { UpdateChildOrderMenuItemDto } from '../order-menu-item/update-child-order-menu-item.dto';

export class UpdateOrderDto {
  @ApiPropertyOptional({
    description: 'Id of OrderType entity.',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  readonly orderCategoryId?: number;

  @ApiPropertyOptional({
    description: 'Name of the owner of the order',
    example: 'John Smith',
  })
  @IsString()
  @IsOptional()
  readonly recipient?: string;

  @ApiPropertyOptional({
    description: 'Name of who is picking up the order or reciving the delivery',
    example: 'Jane Doe',
  })
  @IsString()
  @IsOptional()
  readonly fulfillmentContactName?: string | null;

  @ApiPropertyOptional({
    description: 'Date the order is to be available or delivered.',
    example: '2025-06-08T20:26:45.883Z',
  })
  @IsDate()
  @IsOptional()
  readonly fulfillmentDate?: Date;

  @ApiPropertyOptional({
    description: "Method of Order's dispersal.",
    example: 'delivery',
  })
  @IsString()
  @IsOptional()
  readonly fulfillmentType?: string;

  @ApiPropertyOptional({
    description: 'for delivery contact information',
    example: '123 main st',
  })
  @IsString()
  @IsOptional()
  readonly deliveryAddress?: string | null;

  @ApiPropertyOptional({
    description: 'for delivery contact information',
    example: '1234568',
  })
  @IsString()
  @IsOptional()
  readonly phoneNumber?: string | null;

  @ApiPropertyOptional({
    description: 'for delivery contact information',
    example: 'email@email.com',
  })
  @IsString()
  @IsOptional()
  readonly email?: string | null;

  @ApiPropertyOptional({
    description: 'special instruction for order',
    example: 'note information',
  })
  @IsString()
  @IsOptional()
  readonly note?: string | null;

  @ApiPropertyOptional({
    description:
      'A frozen order is inactive and is not included for typical buisness logic opeations. Not included in aggregates or reports.',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  readonly isFrozen?: boolean;

  @ApiPropertyOptional({
    description: 'Is true if the order occurs on a weekly basis.',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  readonly isWeekly?: boolean;

  @ApiPropertyOptional({
    description: 'If is weekly, is the day of the week the order is fulfilled',
    example: 'sunday',
  })
  @IsString()
  @IsOptional()
  readonly weeklyFulfillment?: string | null;

  @ApiPropertyOptional({
    description:
      'An array of CreateChildOrderMenuItemDtos. Child dtos are used when creating an Order entity with child entites.',
    type: [UpdateChildOrderMenuItemDto],
    example: [
      {
        mode: 'update',
        id: 1,
        menuItemId: 10,
        menuItemSizeId: 2,
        quantity: 3,
        orderedItemContainerDtos: [
          {
            mode: 'update',
            id: 4,
            parentContainerMenuItemId: 10,
            containedMenuItemId: 5,
            containedMenuItemSizeId: 6,
            quantity: 7,
          },
          {
            mode: 'create',
            parentContainerMenuItemId: 10,
            containedMenuItemId: 8,
            containedMenuItemSizeId: 9,
            quantity: 10,
          },
        ],
      },
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
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderMenuItemUnionResolver)
  readonly orderedMenuItemDtos?: (
    | CreateChildOrderMenuItemDto
    | UpdateChildOrderMenuItemDto
  )[];
}
