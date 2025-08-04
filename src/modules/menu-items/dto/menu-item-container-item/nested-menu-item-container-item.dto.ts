import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { CreateMenuItemContainerItemDto } from './create-menu-item-container-item.dto';
import { UpdateMenuItemContainerItemDto } from './update-menu-item-container-item.dto';

export class NestedMenuItemContainerItemDto {
  @ApiProperty({
    description: 'Determines if this dto is to update or create a resource',
    example: 'create',
  })
  @IsNotEmpty()
  readonly mode: 'create' | 'update';

  @ApiPropertyOptional({
    description: 'Id for MenuItemContainerItem entity when updating',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  readonly id?: number;

  @ApiPropertyOptional({
    description: 'CreateMenuItemContainerItemDto',
    example: {
      parentContainerSizeId: 2,
      containedMenuItemId: 3,
      containedMenuItemSizeId: 4,
      quantity: 5,
    },
  })
  @IsOptional()
  @ValidateNested()
  readonly createDto?: CreateMenuItemContainerItemDto;

  @ApiPropertyOptional({
    description: 'UpdateMenuItemContainerItemDto',
    example: {
      containedMenuItemId: 2,
      containedMenuItemSizeId: 3,
      quantity: 4,
    },
  })
  @IsOptional()
  @ValidateNested()
  readonly updateDto?: UpdateMenuItemContainerItemDto;
}
