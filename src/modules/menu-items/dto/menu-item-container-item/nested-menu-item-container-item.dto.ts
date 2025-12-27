import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, ValidateNested } from 'class-validator';
import { NestedDtoBase } from '../../../../common/base/nested-dto.base';
import { CreateMenuItemContainerItemDto } from './create-menu-item-container-item.dto';
import { UpdateMenuItemContainerItemDto } from './update-menu-item-container-item.dto';

export class NestedMenuItemContainerItemDto extends NestedDtoBase<
  CreateMenuItemContainerItemDto,
  UpdateMenuItemContainerItemDto
> {
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
