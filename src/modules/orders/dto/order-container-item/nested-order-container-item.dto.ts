import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { CreateOrderContainerItemDto } from './create-order-container-item.dto';
import { UpdateOrderContainerItemDto } from './update-order-container-item.dto';

export class NestedOrderContainerItemDto {
  @ApiProperty({
    description: 'Determines if this dto is to update or create a resource',
    example: 'create',
  })
  @IsNotEmpty()
  readonly mode: 'create' | 'update';

  @ApiPropertyOptional({
    description: 'Id for OrderContainerItem entity when updating',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  readonly id?: number;

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
