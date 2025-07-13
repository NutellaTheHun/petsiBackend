import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { CreateOrderMenuItemDto } from './create-order-menu-item.dto';
import { NestedUpdateOrderMenuItemDto } from './nested-update-order-menu-item.dto';

export class NestedOrderMenuItemDto {
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
  readonly create?: CreateOrderMenuItemDto;

  @ApiPropertyOptional({
    description: 'Update dto of a OrderMenuItem entity.',
    type: NestedUpdateOrderMenuItemDto,
    example: {
      id: 1,
      dto: {
        menuItemId: 2,
        menuItemSizeId: 3,
        quantity: 4,
      },
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => NestedUpdateOrderMenuItemDto)
  readonly update?: NestedUpdateOrderMenuItemDto;
}
