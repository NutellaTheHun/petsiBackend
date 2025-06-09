import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { MenuItem } from '../../entities/menu-item.entity';

/**
 * Depreciated, only created as a child through {@link MenuItem}.
 */
export class CreateMenuItemContainerItemDto {
  @ApiProperty({
    description:
      'Id of a MenuItem entity, the parent container to the child MenuItem component.',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly parentContainerId: number;

  @ApiProperty({
    description: 'Id of a MenuItemSize entity of the parent container',
    example: 2,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly parentContainerSizeId: number;

  @ApiProperty({
    description:
      'Id of a MenuItem entity. Represents the contained MenuItem item.',
    example: 3,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly containedMenuItemId: number;

  @ApiProperty({
    description: 'Id of a MenuItemSize entity. The size of the contained item',
    example: 4,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly containedMenuItemSizeId: number;

  @ApiProperty({
    description: 'The amount of MenuItem/MenuItemSize combination',
    example: 5,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly quantity: number;
}
