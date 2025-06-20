import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsPositive } from 'class-validator';
import { CreateChildOrderContainerItemDto } from '../order-container-item/create-child-order-container-item.dto';
import { UpdateChildOrderContainerItemDto } from '../order-container-item/update-child-order-container-item.dto';

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
    type: [UpdateChildOrderContainerItemDto],
    example: [
      {
        mode: 'create',
        parentContainerMenuItemId: 10,
        containedMenuItemId: 4,
        containedMenuItemSizeId: 5,
        quantity: 6,
      },
      {
        mode: 'update',
        id: 7,
        parentContainerMenuItemId: 10,
        containedMenuItemId: 8,
        containedMenuItemSizeId: 9,
        quantity: 10,
      },
    ],
  })
  @IsArray()
  @IsOptional()
  readonly orderedItemContainerDtos?: (
    | CreateChildOrderContainerItemDto
    | UpdateChildOrderContainerItemDto
  )[];
}
