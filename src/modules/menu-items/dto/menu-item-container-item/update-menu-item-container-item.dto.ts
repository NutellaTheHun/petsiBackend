import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsPositive,
  ValidateNested,
} from 'class-validator';

export class UpdateMenuItemContainerItemDto {
  @ApiPropertyOptional({
    description: 'Id of a MenuItem entity. Represents the contained item.',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly containedMenuItemId?: number;

  @ApiPropertyOptional({
    description: 'Id of a MenuItemSize entity. The size of the contained item',
    example: 2,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly containedMenuItemSizeId?: number;

  @ApiPropertyOptional({
    description: 'The amount of MenuItem/MenuItemSize combination',
    example: 3,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly quantity?: number;
}

export class NestedUpdateMenuItemContainerItemDto {
  @ApiPropertyOptional({
    description: 'Id of a MenuItemContainerItem entity.',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly id: number;

  @ApiPropertyOptional({
    description: 'UpdateMenuItemContainerItemDto',
    example: {
      containedMenuItemId: 2,
      containedMenuItemSizeId: 3,
      quantity: 4,
    },
  })
  @ValidateNested()
  readonly dto: UpdateMenuItemContainerItemDto;
}
