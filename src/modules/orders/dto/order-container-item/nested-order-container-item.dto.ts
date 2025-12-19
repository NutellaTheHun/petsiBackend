import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { NestedDtoBase } from '../../../../common/base/nested-dto.base';
import { CreateOrderContainerItemDto } from './create-order-container-item.dto';
import { UpdateOrderContainerItemDto } from './update-order-container-item.dto';

export class NestedOrderContainerItemDto extends NestedDtoBase<
  CreateOrderContainerItemDto,
  UpdateOrderContainerItemDto
> {
  @ApiPropertyOptional({
    description: 'Create dto of a OrderContainerItem entity.',
    type: CreateOrderContainerItemDto,
    example: {
      parentContainerMenuItemId: 1,
      containedMenuItemId: 2,
      containedMenuItemSizeId: 3,
      quantity: 4,
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateOrderContainerItemDto)
  readonly createDto?: CreateOrderContainerItemDto;

  @ApiPropertyOptional({
    description: 'Update dto of a OrderContainerItem entity.',
    type: UpdateOrderContainerItemDto,
    example: {
      parentContainerMenuItemId: 1,
      containedMenuItemId: 2,
      containedMenuItemSizeId: 3,
      quantity: 4,
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateOrderContainerItemDto)
  readonly updateDto?: UpdateOrderContainerItemDto;
}
