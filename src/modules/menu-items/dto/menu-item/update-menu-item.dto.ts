import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

import { NestedMenuItemContainerItemDto } from '../menu-item-container-item/nested-menu-item-container-item.dto';
import { NestedMenuItemContainerOptionsDto } from '../menu-item-container-options/nested-menu-item-container-options.dto';

export class UpdateMenuItemDto {
  @ApiPropertyOptional({
    description:
      'Id of MenuItemCategory entity. Pass a null value to remove category',
    example: 1,
    nullable: true,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly categoryId?: number | null;

  @ApiPropertyOptional({
    description: 'Name of MenuItem entity.',
    example: 'box of 6 muffins',
    nullable: true,
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  readonly itemName?: string;

  @ApiPropertyOptional({
    description:
      'Id of MenuItem entity that is the vegan version of the referencing MenuItem. Pass a null value to remove vegan option',
    example: 2,
    nullable: true,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly veganOptionMenuId?: number | null;

  @ApiPropertyOptional({
    description:
      "Id of MenuItem entity that is the Take 'n Bake version of the referencing MenuItem. Pass a null value to remove take n bake option",
    example: 3,
    nullable: true,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly takeNBakeOptionMenuId?: number | null;

  @ApiPropertyOptional({
    description:
      "Id of MenuItem entity that is the vegan Take 'n Bake version of the referencing MenuItem. Pass a null value to remove vegan take n bake option",
    example: 4,
    nullable: true,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly veganTakeNBakeOptionMenuId?: number | null;

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
      'Is Pie of the Month, monthly rotating special, relevant for Pie baking lists.',
    example: false,
    nullable: true,
    type: 'boolean',
  })
  @IsBoolean()
  @IsOptional()
  readonly isPOTM?: boolean;

  @ApiPropertyOptional({
    description: 'Pie requires parbaked shells',
    example: false,
    nullable: true,
    type: 'boolean',
  })
  @IsBoolean()
  @IsOptional()
  readonly isParbake?: boolean;

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
  readonly definedContainerItemDtos?: NestedMenuItemContainerItemDto[];

  // should be nullable?
  @ApiPropertyOptional({
    description:
      'options for the menuItem if it serves as a container to other items. Sets rules like valid items and item sizes, and quantity of the container. Pass a null value to remove container options',
    type: () => NestedMenuItemContainerOptionsDto,
    example: {
      mode: 'update',
      id: 1,
      updateDto: {
        containerRuleDtos: [
          {
            validMenuItemId: 5,
            validSizeIds: [6, 7],
          },
        ],
        id: 8,
        validMenuItemId: 9,
        validSizeIds: [10, 11],
        validQuantity: 12,
      },
    },
  })
  @IsOptional()
  readonly containerOptionDto?: NestedMenuItemContainerOptionsDto;
}
