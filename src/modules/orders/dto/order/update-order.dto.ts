import { ApiPropertyOptional } from '@nestjs/swagger';
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
import { EntityId } from '../../../../common/types';
import { OrderCategory } from '../../entities/order-category.entity';
import { NestedOrderMenuItemDto } from '../order-menu-item/nested-order-menu-item.dto';

export class UpdateOrderDto {
  @ApiPropertyOptional({
    description: 'Name of the owner of the order',
    example: 'John Smith',
    type: 'string',
  })
  @IsString()
  @IsOptional()
  readonly recipient?: string;

  @ApiPropertyOptional({
    description: 'Date the order is to be available or delivered.',
    example: '2025-06-08T20:26:45.883Z',
    type: 'string',
  })
  @IsDate()
  @IsOptional()
  readonly fulfillmentDate?: Date;

  @ApiPropertyOptional({
    description: "Method of Order's dispersal.",
    example: 'delivery',
    type: 'string',
  })
  @IsString()
  @IsOptional()
  readonly fulfillmentType?: string;

  @ApiPropertyOptional({
    description: 'Name of who is picking up the order or reciving the delivery',
    example: 'Jane Doe',
    type: 'string',
  })
  @IsString()
  @IsOptional()
  readonly fulfillmentContactName?: string;

  @ApiPropertyOptional({
    description: 'for delivery contact information',
    example: '123 main st',
    type: 'string',
  })
  @IsString()
  @IsOptional()
  readonly deliveryAddress?: string;

  @ApiPropertyOptional({
    description: 'for delivery contact information',
    example: '1234568',
    type: 'string',
  })
  @IsString()
  @IsOptional()
  readonly phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'for delivery contact information',
    example: 'email@email.com',
    type: 'string',
    format: 'email',
  })
  @IsString()
  @IsOptional()
  readonly email?: string;

  @ApiPropertyOptional({
    description: 'special instruction for order',
    example: 'note information',
    type: 'string',
  })
  @IsString()
  @IsOptional()
  readonly note?: string;

  @ApiPropertyOptional({
    description:
      'A frozen order is inactive and is not included for typical buisness logic opeations. Not included in aggregates or reports.',
    example: false,
    type: 'boolean',
  })
  @IsBoolean()
  @IsOptional()
  readonly isFrozen?: boolean;

  @ApiPropertyOptional({
    description: 'Is true if the order occurs on a weekly basis.',
    example: true,
    type: 'boolean',
  })
  @IsBoolean()
  @IsOptional()
  readonly isWeekly?: boolean;

  @ApiPropertyOptional({
    description: 'If is weekly, is the day of the week the order is fulfilled',
    example: 'sunday',
    type: 'string',
  })
  @IsString()
  @IsOptional()
  readonly weeklyFulfillment?: string;

  @ApiPropertyOptional({
    description: 'Id of OrderType entity.',
    example: 1,
    type: 'number',
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  readonly categoryId?: EntityId<OrderCategory>;

  @ApiPropertyOptional({
    description:
      'An array of CreateChildOrderMenuItemDtos. Child dtos are used when creating an Order entity with child entites.',
    type: () => [NestedOrderMenuItemDto],
    example: [
      {
        mode: 'create',
        createDto: {
          orderId: 1,
          menuItemId: 2,
          menuItemSizeId: 3,
          quantity: 4,
        },
      },
      {
        mode: 'update',
        id: 1,
        updateDto: {
          id: 1,
          dto: {
            menuItemId: 2,
            menuItemSizeId: 3,
            quantity: 4,
          },
        },
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  readonly orderedItems?: NestedOrderMenuItemDto[];
}
