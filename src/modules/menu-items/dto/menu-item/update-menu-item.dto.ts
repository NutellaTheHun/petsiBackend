import { ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

import { EntityId } from '../../../../common/types';
import { MenuItemCategory } from '../../entities/menu-item-category.entity';
import { MenuItemSize } from '../../entities/menu-item-size.entity';
import { NestedCreateMenuItemContainerItemDto } from '../menu-item-container-item/nested-create-menu-item-container-item.dto';
import { NestedUpdateMenuItemContainerItemDto } from '../menu-item-container-item/nested-update-menu-item-container-item.dto';

export class UpdateMenuItemDto {
  @ApiPropertyOptional({
    description: 'Name of MenuItem entity.',
    example: 'box of 6 muffins',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  readonly name?: string;

  @ApiPropertyOptional({
    description: 'Can be single, fixed_container, or variable_container',
    example: 'fixed_container',
    type: 'string',
  })
  @IsNotEmpty()
  @IsString()
  readonly type?: string;

  @ApiPropertyOptional({
    description:
      'Id of MenuItemCategory entity. Pass a null value to remove category',
    example: 1,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly categoryId?: EntityId<MenuItemCategory>;

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
  readonly sizeIds?: EntityId<MenuItemSize>[];

  @ApiPropertyOptional({
    description:
      'Array of CreateChildMenutItemContainerItemDtos. Child dtos are used when creating a parent with child entities. Pass a null value to remove defined container',
    type: 'array',
    oneOf: [
      { $ref: getSchemaPath(NestedCreateMenuItemContainerItemDto) },
      { $ref: getSchemaPath(NestedUpdateMenuItemContainerItemDto) },
    ],
    example: [
      {
        id: 1,
        containedMenuItemId: 2,
        containedMenuItemSizeId: 3,
        quantity: 4,
      },
      {
        createId: 'c5',
        containedMenuItemId: 6,
        containedMenuItemSizeId: 7,
        quantity: 8,
        parentMenuItemId: 9,
        parentItemSizeId: 10,
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  readonly containerMenuItems?: (
    | NestedCreateMenuItemContainerItemDto
    | NestedUpdateMenuItemContainerItemDto
  )[];

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
