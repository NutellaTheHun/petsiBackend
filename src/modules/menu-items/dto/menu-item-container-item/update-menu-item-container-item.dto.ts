import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';
import { EntityId } from '../../../../common/types';
import { MenuItemSize } from '../../entities/menu-item-size.entity';
import { MenuItem } from '../../menu-items.module';

export class UpdateMenuItemContainerItemDto {
  @ApiPropertyOptional({
    description: 'Id of a MenuItem entity. Represents the contained item.',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly containedMenuItemId?: EntityId<MenuItem>;

  @ApiPropertyOptional({
    description: 'Id of a MenuItemSize entity. The size of the contained item',
    example: 2,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly containedItemSizeId?: EntityId<MenuItemSize>;

  @ApiPropertyOptional({
    description: 'The amount of MenuItem/MenuItemSize combination',
    example: 3,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly quantity?: number;
}
