import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class CreateMenuItemContainerItemDto {
  @ApiProperty({
    description:
      'Id of a MenuItem entity, the parent container to the child MenuItem component. Is required if sending DTO to menu-item-container-item endpoint. Is not required if sending DTO as a nested dto of a create menu-item request.',
    example: 1,
    required: false,
    nullable: true,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly parentContainerId?: number;

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
