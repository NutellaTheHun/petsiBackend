import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsPositive,
  ValidateNested,
} from 'class-validator';
import { UpdateMenuItemContainerItemDto } from './update-menu-item-container-item.dto';

export class NestedUpdateMenuItemContainerItemDto {
  @ApiPropertyOptional({
    description: 'Id of a MenuItemContainerItem entity.',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly id: number;

  @ApiPropertyOptional({
    description: 'UpdateMenuItemContainerItemDto',
    example: {
      containedMenuItemId: 2,
      containedMenuItemSizeId: 3,
      quantity: 4,
    },
  })
  @ValidateNested()
  readonly dto: UpdateMenuItemContainerItemDto;
}
