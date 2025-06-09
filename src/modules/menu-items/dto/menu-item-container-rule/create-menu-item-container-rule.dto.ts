import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { MenuItemContainerOptions } from '../../entities/menu-item-container-options.entity';

/**
 * Depreciated, only created as a child through {@link MenuItemContainerOptions}.
 */
export class CreateMenuItemContainerRuleDto {
  @ApiProperty({
    description: 'Id of the MenuItemContainerOptions entity.',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  parentContainerOptionsId: number;

  @ApiProperty({
    description: 'Id of a MenuItem entity that is a valid component',
    example: 2,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  validMenuItemId: number;

  @ApiProperty({
    description:
      'Id of a MenuItemSize entity that is a valid size to the validMenuItem, and to the container',
    example: [3, 4],
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  validSizeIds: number[];
}
