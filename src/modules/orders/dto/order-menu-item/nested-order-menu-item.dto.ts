import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { NestedDtoBase } from '../../../../base/nested-dto-base';
import { CreateOrderMenuItemDto } from './create-order-menu-item.dto';
import { UpdateOrderMenuItemDto } from './update-order-menu-item.dto';

export class NestedOrderMenuItemDto extends NestedDtoBase<
  CreateOrderMenuItemDto,
  UpdateOrderMenuItemDto
> {
  @ApiPropertyOptional({
    description: 'Create dto of a OrderMenuItem entity.',
    type: CreateOrderMenuItemDto,
    example: {
      orderId: 1,
      menuItemId: 2,
      menuItemSizeId: 3,
      quantity: 4,
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateOrderMenuItemDto)
  readonly createDto?: CreateOrderMenuItemDto;

  @ApiPropertyOptional({
    description: 'Update dto of a OrderMenuItem entity.',
    type: UpdateOrderMenuItemDto,
    example: {
      menuItemId: 2,
      menuItemSizeId: 3,
      quantity: 4,
      orderedItemContainerDtos: [
        {
          mode: 'create',
          createDto: {
            parentContainerMenuItemId: 2,
            containedMenuItemId: 3,
            containedMenuItemSizeId: 3,
            quantity: 4,
          },
        },
        {
          mode: 'update',
          id: 4,
          updateDto: {
            parentContainerMenuItemId: 2,
            containedMenuItemId: 3,
            containedMenuItemSizeId: 3,
            quantity: 4,
          },
        },
      ],
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateOrderMenuItemDto)
  readonly updateDto?: UpdateOrderMenuItemDto;
}
