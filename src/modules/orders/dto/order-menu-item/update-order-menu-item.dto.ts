import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsPositive } from 'class-validator';
import { NestedOrderContainerItemDto } from '../order-container-item/nested-order-container-item.dto';

export class UpdateOrderMenuItemDto {
  @ApiPropertyOptional({
    description: 'Id of MenuItem entity being ordered.',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  readonly menuItemId?: number;

  @ApiPropertyOptional({
    description:
      'Id of the MenuItemSize entity. Must be valid size for the MenuItem being ordered.',
    example: 2,
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  readonly menuItemSizeId?: number;

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
        create: {
          parentContainerMenuItemId: 10,
          containedMenuItemId: 4,
          containedMenuItemSizeId: 5,
          quantity: 6,
        },
        update: {
          id: 1,
          dto: {
            parentContainerMenuItemId: 10,
            containedMenuItemId: 4,
            containedMenuItemSizeId: 5,
            quantity: 6,
          },
        },
      },
    ],
  })
  @IsArray()
  @IsOptional()
  readonly orderedItemContainerDtos?: NestedOrderContainerItemDto[];
}
