import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';

export class UpdateOrderContainerItemDto {
  @ApiPropertyOptional({
    description:
      'Id of the MenuItem that is being ordered, requires parentMenuItemId_ctx and parentMenuItemSizeId_ctx to be populated',
    example: 2,
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  readonly containedMenuItemId?: number;

  @ApiPropertyOptional({
    description:
      'Id of the MenuItemSize that is being ordered, must be a valid size to the containedMenuItem,  requires parentMenuItemId_ctx and parentMenuItemSizeId_ctx to be populated',
    example: 3,
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  readonly containedItemSizeId?: number;

  @ApiPropertyOptional({
    description:
      'amount of the containedMenuItem / containedItemSize being ordered',
    example: 4,
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  readonly quantity?: number;

  @ApiPropertyOptional({
    description:
      "Id of the MenuItem that is this item's container, must be provided when updating containedMenuItem or containedMenuItemSize, ctx denotes it is used to assist in creating the entity, but is not a mapped property",
    example: 2,
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  readonly parentMenuItemIdCtx?: number;

  @ApiPropertyOptional({
    description:
      "Id of the MenuItemSize of the Menuitem that is this item's container, must be provided when updating containedMenuItem or containedMenuItemSize ctx denotes it is used to assist in creating the entity, but is not a mapped property",
    example: 2,
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  readonly parentMenuItemSizeIdCtx?: number;
}
