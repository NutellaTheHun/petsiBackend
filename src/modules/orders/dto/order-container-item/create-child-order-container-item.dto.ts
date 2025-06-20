import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class CreateChildOrderContainerItemDto {
  @ApiProperty({
    description:
      'Declare whether creating or updating a child entity. Relevant when creating/updating a OrderMenuItem entity.',
    example: 'create',
  })
  readonly mode: 'create' = 'create';

  @ApiProperty({
    description: "Id of the MenuItem that is this item's container",
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  readonly parentContainerMenuItemId: number;

  @ApiProperty({
    description: 'Id of the MenuItem that is being ordered',
    example: 2,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  readonly containedMenuItemId: number;

  @ApiProperty({
    description:
      'Id of the MenuItemSize that is being ordered, must be a valid size to the containedMenuItem',
    example: 3,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  readonly containedMenuItemSizeId: number;

  @ApiProperty({
    description:
      'amount of the containedMenuItem / containedItemSize being ordered',
    example: 4,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  readonly quantity: number;
}
