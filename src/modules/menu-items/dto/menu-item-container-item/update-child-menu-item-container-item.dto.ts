import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class UpdateChildMenuItemContainerItemDto {
  @ApiProperty({
    description:
      'Declare whether creating or updating a child entity. Relevant when creating/updting a MenuItem entity with components.',
    example: 'update',
  })
  @IsNotEmpty()
  readonly mode: 'update' = 'update';

  @ApiProperty({
    description: 'Id of a MenuItemContainerItem to update.',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly id: number;

  @ApiProperty({
    description:
      'Id of a MenuItem entity. Represents the contained MenuItem item.',
    example: 2,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly containedMenuItemId?: number;

  @ApiProperty({
    description: 'Id of a MenuItemSize entity. The size of the contained item',
    example: 3,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly containedMenuItemSizeId?: number;

  @ApiProperty({
    description: 'The amount of MenuItem/MenuItemSize combination',
    example: 4,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly quantity?: number;
}
