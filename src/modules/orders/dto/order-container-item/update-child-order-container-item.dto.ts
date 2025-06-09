import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class UpdateChildOrderContainerItemDto {
  @ApiProperty({
    description:
      'Declare whether creating or updating a child entity. Relevant when creating/updating a OrderMenuItem entity.',
    example: 'update',
  })
  @IsNotEmpty()
  readonly mode: 'update' = 'update';

  @ApiProperty({
    description: 'Id of the OrderMenuItemContainerItem to update.',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly id: number;

  @ApiProperty({
    description:
      "Id of the MenuItem that is this item's container, not available to update, but required for validation",
    example: 2,
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  parentContainerMenuItemId?: number;

  @ApiProperty({
    description: 'Id of the MenuItem being ordered',
    example: 3,
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  containedMenuItemId?: number;

  @ApiProperty({
    description:
      'Id of the MenuItemSize that is being ordered, must be a valid size to the containedMenuItem',
    example: 4,
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  containedMenuItemSizeId?: number;

  @ApiProperty({
    description:
      'amount of the componentMenuItem / componentItemSize being ordered',
    example: 5,
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  quantity?: number;
}
