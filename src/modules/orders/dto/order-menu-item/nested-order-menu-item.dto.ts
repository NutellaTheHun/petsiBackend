import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { CreateOrderMenuItemDto } from './create-order-menu-item.dto';
import { UpdateOrderMenuItemDto } from './update-order-menu-item.dto';

export class NestedOrderMenuItemDto {
  @ApiProperty({
    description: 'Determines if this dto is to update or create a resource',
    example: 'create',
  })
  @IsNotEmpty()
  readonly mode: 'create' | 'update';

  @ApiPropertyOptional({
    description: 'Id for OrderMenuItem entity when updating',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  readonly id?: number;

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
