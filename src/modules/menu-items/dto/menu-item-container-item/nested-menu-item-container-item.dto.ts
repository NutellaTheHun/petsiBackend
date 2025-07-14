import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsPositive,
  ValidateNested,
} from 'class-validator';
import { CreateMenuItemContainerItemDto } from './create-menu-item-container-item.dto';
import { NestedUpdateMenuItemContainerItemDto } from './nested-update-menu-item-container-item.dto';

export class NestedMenuItemContainerItemDto {
  @ApiPropertyOptional({
    description: 'CreateMenuItemContainerItemDto',
    example: {
      parentContainerId: 1,
      parentContainerSizeId: 2,
      containedMenuItemId: 3,
      containedMenuItemSizeId: 4,
      quantity: 5,
    },
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly create?: CreateMenuItemContainerItemDto;

  @ApiPropertyOptional({
    description: 'UpdateMenuItemContainerItemDto',
    example: {
      id: 1,
      dto: {
        containedMenuItemId: 2,
        containedMenuItemSizeId: 3,
        quantity: 4,
      },
    },
  })
  @ValidateNested()
  readonly update?: NestedUpdateMenuItemContainerItemDto;
}
