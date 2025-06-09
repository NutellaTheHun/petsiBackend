import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { CreateChildMenuItemContainerItemDto } from '../menu-item-container-item/create-child-menu-item-container-item.dto';
import { CreateChildMenuItemContainerOptionsDto } from '../menu-item-container-options/create-child-menu-item-container-options.dto';

export class CreateMenuItemDto {
  @ApiProperty({
    description: 'Id of MenuItemCategory entity.',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly categoryId?: number;

  @ApiProperty({
    description: 'Name of MenuItem entity.',
    example: 'classic apple',
  })
  @IsString()
  @IsNotEmpty()
  readonly itemName: string;

  @ApiProperty({
    description:
      'Id of MenuItem entity that is the vegan version of the referencing MenuItem.',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly veganOptionMenuId?: number;

  @ApiProperty({
    description:
      "Id of MenuItem entity that is the Take 'n Bake version of the referencing MenuItem.",
    example: 3,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly takeNBakeOptionMenuId?: number;

  @ApiProperty({
    description:
      "Id of MenuItem entity that is the vegan Take 'n Bake version of the referencing MenuItem.",
    example: 4,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly veganTakeNBakeOptionMenuId?: number;

  @ApiProperty({
    description:
      'Ids of MenuItemSize entities. Represents the sizes available for the referencing MenuItem.',
    example: [5, 6],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsPositive({ each: true })
  @IsNotEmpty()
  readonly validSizeIds: number[];

  @ApiProperty({
    description:
      'Is Pie of the Month, monthly rotating special, relevant for Pie baking lists.',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  readonly isPOTM?: boolean;

  @ApiProperty({
    description: 'If pie requires parbaked shells',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  readonly isParbake?: boolean;

  @ApiProperty({
    description:
      'Array of CreateChildMenutItemContainerItemDtos. Child dtos are used when creating a parent with child entities.',
    type: [CreateChildMenuItemContainerItemDto],
    example: [
      {
        mode: 'create',
        parentContainerSizeId: 1,
        containedMenuItemId: 2,
        containedMenuItemSizeId: 3,
        quantity: 4,
      },
    ],
  })
  @IsOptional()
  @IsArray()
  readonly definedContainerItemDtos?: CreateChildMenuItemContainerItemDto[];

  @ApiProperty({
    description:
      'options for the menuItem if it serves as a container to other items. Sets rules like valid items, sizes, and quantity of the container.',
    type: CreateChildMenuItemContainerOptionsDto,
    example: {
      mode: 'create',
      containerRuleDtos: [
        {
          mode: 'create',
          validMenuItemId: 5,
          validSizeIds: [6, 7],
        },
        {
          mode: 'create',
          validMenuItemId: 8,
          validSizeIds: [9, 10],
        },
      ],
      validQuantity: 11,
    },
  })
  @IsOptional()
  readonly containerOptionDto?: CreateChildMenuItemContainerOptionsDto;
}
