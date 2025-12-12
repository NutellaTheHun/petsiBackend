import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

import { NestedMenuItemContainerItemDto } from '../menu-item-container-item/nested-menu-item-container-item.dto';

export class UpdateMenuItemDto {
  @ApiPropertyOptional({
    description:
      'Id of MenuItemCategory entity. Pass a null value to remove category',
    example: 1,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly categoryId?: number;

  @ApiPropertyOptional({
    description: 'Can be single, fixed_container, or variable_container',
    example: 'fixed_container',
    type: 'string',
  })
  @IsNotEmpty()
  @IsString()
  readonly type?: string;

  @ApiPropertyOptional({
    description: 'Name of MenuItem entity.',
    example: 'box of 6 muffins',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  readonly itemName?: string;

  @ApiPropertyOptional({
    description:
      'Ids of MenuItemSize entities. Represents the sizes available for the referencing MenuItem.',
    example: [5, 6],
    type: () => [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsPositive({ each: true })
  @IsOptional()
  readonly validSizeIds?: number[];

  @ApiPropertyOptional({
    description:
      'Array of CreateChildMenutItemContainerItemDtos. Child dtos are used when creating a parent with child entities. Pass a null value to remove defined container',
    type: () => [NestedMenuItemContainerItemDto],
    example: [
      {
        mode: 'update',
        id: 1,
        updateDto: {
          containedMenuItemId: 6,
          containedMenuItemSizeId: 7,
          quantity: 8,
        },
      },
      {
        mode: 'create',
        createDto: {
          containedMenuItemId: 6,
          containedMenuItemSizeId: 7,
          quantity: 8,
        },
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  readonly containerMenuItemDtos?: NestedMenuItemContainerItemDto[];

  @ApiPropertyOptional({
    description:
      'Total size limit of item, when item is of type fixed_container or variable_container',
    type: 'number',
    example: 6,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly variableMaxAmount?: number;
}
