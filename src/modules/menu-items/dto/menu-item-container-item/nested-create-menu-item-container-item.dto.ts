import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from 'class-validator';
import { NestedCreate } from '../../../../common/base/nested-create.base';
import { EntityId } from '../../../../common/types';
import { MenuItemSize } from '../../entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items.module';

export class NestedCreateMenuItemContainerItemDto extends NestedCreate {
  @ApiProperty({
    description:
      'Id of a MenuItem entity. Represents the contained MenuItem item.',
    example: 3,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly containedMenuItemId: EntityId<MenuItem>;

  @ApiProperty({
    description: 'Id of a MenuItemSize entity. The size of the contained item',
    example: 4,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly containedItemSizeId: EntityId<MenuItemSize>;

  @ApiProperty({
    description: 'The amount of MenuItem/MenuItemSize combination',
    example: 5,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly quantity: number;

  // Is this actually required/optional?
  @ApiPropertyOptional({
    description: 'Id of a MenuItemSize entity of the parent container',
    example: 2,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly parentItemSizeId?: EntityId<MenuItemSize>;
}
