import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
import { NestedMenuItemContainerRuleDto } from '../menu-item-container-rule/nested-menu-item-container-rule.dto';

export class CreateMenuItemDto {
  @ApiPropertyOptional({
    description: 'Id of MenuItemCategory entity.',
    example: 1,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly categoryId?: number;

  @ApiProperty({
    description: 'Can be single, fixed_container, or variable_container',
    example: 'fixed_container',
    nullable: true,
    type: 'string',
  })
  @IsNotEmpty()
  @IsString()
  readonly type: string;

  @ApiProperty({
    description: 'Name of MenuItem entity.',
    example: 'classic apple',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  readonly itemName: string;

  @ApiProperty({
    description:
      'Ids of MenuItemSize entities. Represents the sizes available for the referencing MenuItem.',
    example: [5, 6],
    type: () => Number,
    isArray: true,
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsPositive({ each: true })
  @IsNotEmpty()
  readonly validSizeIds: number[];

  @ApiPropertyOptional({
    description: 'Array of CreateMenutItemContainerItemDtos',
    type: () => [NestedMenuItemContainerItemDto],
    example: [
      {
        mode: 'create',
        createDto: {
          parentContainerSizeId: 1,
          containedMenuItemId: 2,
          containedMenuItemSizeId: 3,
          quantity: 4,
        },
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  readonly fixedContentDtos?: NestedMenuItemContainerItemDto[];

  @ApiPropertyOptional({
    description:
      'options for the menuItem if it serves as a container to other items. Sets rules like valid items, sizes, and quantity of the container.',
    type: () => [NestedMenuItemContainerRuleDto],
    example: [
      {
        mode: 'create',
        createDto: {
          validMenuItemId: 5,
          validSizeIds: [6, 7],
          maxQuantity: 8,
        },
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  readonly variableRuleDtos?: NestedMenuItemContainerRuleDto[];

  @ApiPropertyOptional({
    description:
      'Total size limit of item, when item is of type fixed_container or variable_container',
    type: 'number',
    example: 7,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly variableMaxAmount?: number;
}
