import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class CreateChildMenuItemContainerItemDto {
  @ApiProperty({
    description:
      'Declare whether creating or updating a child entity. Relevant when creating/updating a MenuItem entity with components.',
    example: 'create',
  })
  @IsNotEmpty()
  readonly mode: 'create' = 'create';

  @ApiProperty({
    description: 'Id of a MenuItemSize entity of the parent container',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly parentContainerSizeId: number;

  @ApiProperty({
    description:
      'Id of a MenuItem entity. Represents the contained MenuItem item.',
    example: 2,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly containedMenuItemId: number;

  @ApiProperty({
    description: 'Id of a MenuItemSize. The size of the contained item',
    example: 3,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly containedMenuItemSizeId: number;

  @ApiProperty({
    description: 'The amount of MenuItem/MenuItemSize combination',
    example: 4,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly quantity: number;
}
