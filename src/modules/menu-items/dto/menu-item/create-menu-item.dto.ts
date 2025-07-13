import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { CreateMenuItemContainerItemDto } from '../menu-item-container-item/create-menu-item-container-item.dto';
import { CreateChildMenuItemContainerOptionsDto } from '../menu-item-container-options/create-child-menu-item-container-options.dto';

export class CreateMenuItemDto {
  @ApiProperty({
    description: 'Id of MenuItemCategory entity.',
    example: 1,
    nullable: true,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly categoryId?: number;

  @ApiProperty({
    description: 'Name of MenuItem entity.',
    example: 'classic apple',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  readonly itemName: string;

  @ApiPropertyOptional({
    description:
      'Id of MenuItem entity that is the vegan version of the referencing MenuItem.',
    example: 2,
    nullable: true,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly veganOptionMenuId?: number;

  @ApiPropertyOptional({
    description:
      "Id of MenuItem entity that is the Take 'n Bake version of the referencing MenuItem.",
    example: 3,
    nullable: true,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly takeNBakeOptionMenuId?: number;

  @ApiPropertyOptional({
    description:
      "Id of MenuItem entity that is the vegan Take 'n Bake version of the referencing MenuItem.",
    example: 4,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly veganTakeNBakeOptionMenuId?: number;

  @ApiProperty({
    description:
      'Ids of MenuItemSize entities. Represents the sizes available for the referencing MenuItem.',
    example: [5, 6],
    type: () => [Number],
    isArray: true,
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsPositive({ each: true })
  @IsNotEmpty()
  readonly validSizeIds: number[];

  @ApiPropertyOptional({
    description:
      'Is Pie of the Month, monthly rotating special, relevant for Pie baking lists.',
    example: false,
    type: 'boolean',
  })
  @IsBoolean()
  @IsOptional()
  readonly isPOTM?: boolean;

  @ApiPropertyOptional({
    description: 'If pie requires parbaked shells',
    example: false,
    nullable: true,
    type: 'boolean',
  })
  @IsBoolean()
  @IsOptional()
  readonly isParbake?: boolean;

  @ApiProperty({
    description: 'Array of CreateMenutItemContainerItemDtos',
    type: () => [CreateMenuItemContainerItemDto],
    example: [
      {
        parentContainerSizeId: 1,
        containedMenuItemId: 2,
        containedMenuItemSizeId: 3,
        quantity: 4,
      },
    ],
  })
  @IsOptional()
  @IsArray()
  readonly definedContainerItemDtos?: CreateMenuItemContainerItemDto[];

  @ApiProperty({
    description:
      'options for the menuItem if it serves as a container to other items. Sets rules like valid items, sizes, and quantity of the container.',
    type: () => CreateChildMenuItemContainerOptionsDto,
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
