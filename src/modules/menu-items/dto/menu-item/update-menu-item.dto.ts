import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
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
import { MenuItemComponentUnionResolver } from '../../utils/menu-item-component-union-resolver';
import { CreateChildMenuItemContainerItemDto } from '../menu-item-container-item/create-child-menu-item-container-item.dto';
import { UpdateChildMenuItemContainerItemDto } from '../menu-item-container-item/update-child-menu-item-container-item.dto';
import { CreateChildMenuItemContainerOptionsDto } from '../menu-item-container-options/create-child-menu-item-container-options.dto';
import { UpdateChildMenuItemContainerOptionsDto } from '../menu-item-container-options/update-child-menu-item-container-options.dto';

export class UpdateMenuItemDto {
  @ApiPropertyOptional({
    description:
      'Id of MenuItemCategory entity. Pass a null value to remove category',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly categoryId?: number | null;

  @ApiPropertyOptional({
    description: 'Name of MenuItem entity.',
    example: 'box of 6 muffins',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  readonly itemName?: string;

  @ApiPropertyOptional({
    description:
      'Id of MenuItem entity that is the vegan version of the referencing MenuItem. Pass a null value to remove vegan option',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly veganOptionMenuId?: number | null;

  @ApiPropertyOptional({
    description:
      "Id of MenuItem entity that is the Take 'n Bake version of the referencing MenuItem. Pass a null value to remove take n bake option",
    example: 3,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly takeNBakeOptionMenuId?: number | null;

  @ApiPropertyOptional({
    description:
      "Id of MenuItem entity that is the vegan Take 'n Bake version of the referencing MenuItem. Pass a null value to remove vegan take n bake option",
    example: 4,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly veganTakeNBakeOptionMenuId?: number | null;

  @ApiPropertyOptional({
    description:
      'Ids of MenuItemSize entities. Represents the sizes available for the referencing MenuItem.',
    example: [5, 6],
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
  })
  @IsBoolean()
  @IsOptional()
  readonly isPOTM?: boolean;

  @ApiProperty({ description: 'Pie requires parbaked shells', example: false })
  @IsBoolean()
  @IsOptional()
  readonly isParbake?: boolean;

  @ApiPropertyOptional({
    description:
      'Array of CreateChildMenutItemContainerItemDtos. Child dtos are used when creating a parent with child entities. Pass a null value to remove defined container',
    type: [UpdateChildMenuItemContainerItemDto],
    example: [
      {
        mode: 'create',
        parentContainerSizeId: 1,
        containedMenuItemId: 2,
        containedMenuItemSizeId: 3,
        quantity: 4,
      },
      {
        mode: 'update',
        id: 5,
        parentContainerSizeId: 6,
        containedMenuItemId: 7,
        containedMenuItemSizeId: 8,
        quantity: 9,
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuItemComponentUnionResolver)
  readonly definedContainerItemDtos?:
    | (
        | CreateChildMenuItemContainerItemDto
        | UpdateChildMenuItemContainerItemDto
      )[]
    | null;

  @ApiPropertyOptional({
    description:
      'options for the menuItem if it serves as a container to other items. Sets rules like valid items and item sizes, and quantity of the container. Pass a null value to remove container options',
    type: UpdateChildMenuItemContainerOptionsDto,
    example: {
      mode: 'create',
      containerRuleDtos: [
        {
          mode: 'create',
          validMenuItemId: 5,
          validSizeIds: [6, 7],
        },
        {
          mode: 'update',
          id: 8,
          validMenuItemId: 9,
          validSizeIds: [10, 11],
        },
      ],
      validQuantity: 12,
    },
  })
  @IsOptional()
  readonly containerOptionDto?:
    | CreateChildMenuItemContainerOptionsDto
    | UpdateChildMenuItemContainerOptionsDto
    | null;
}
