import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';

export class UpdateMenuItemContainerItemDto {
  @ApiProperty({
    description: 'Id of a MenuItem entity. Represents the contained item.',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly containedMenuItemId?: number;

  @ApiProperty({
    description: 'Id of a MenuItemSize entity. The size of the contained item',
    example: 2,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly containedMenuItemSizeId?: number;

  @ApiProperty({
    description: 'The amount of MenuItem/MenuItemSize combination',
    example: 3,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly quantity?: number;
}
