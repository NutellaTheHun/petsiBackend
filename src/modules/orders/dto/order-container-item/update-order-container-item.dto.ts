import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';

export class UpdateOrderContainerItemDto {
  @ApiProperty({
    description:
      "Id of the MenuItem that is this item's container, not available to update, but required for validation",
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  parentContainerMenuItemId?: number;

  @ApiProperty({
    description: 'Id of the MenuItem that is being ordered',
    example: 2,
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  containedMenuItemId?: number;

  @ApiProperty({
    description:
      'Id of the MenuItemSize that is being ordered, must be a valid size to the containedMenuItem',
    example: 3,
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  containedMenuItemSizeId?: number;

  @ApiProperty({
    description:
      'amount of the containedMenuItem / containedItemSize being ordered',
    example: 4,
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  quantity?: number;
}
