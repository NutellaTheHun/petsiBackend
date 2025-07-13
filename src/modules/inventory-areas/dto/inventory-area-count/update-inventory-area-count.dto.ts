import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { UpdateInventoryAreaItemDto } from '../inventory-area-item/update-inventory-area-item.dto';

export class NestedUpdateInventoryAreaItemDto {
  @ApiProperty({
    description: 'Id for InventoryAreaItem entity.',
    example: 1,
  })
  @IsNumber()
  readonly id: number;

  @ApiProperty({
    description: 'UpdateInventoryAreaItemDto for InventoryAreaItem entity.',
    type: UpdateInventoryAreaItemDto,
    example: {
      measureUnitId: 4,
      measureAmount: 5,
      inventoryPackageId: 6,
      cost: 7.99,
    },
  })
  @ValidateNested()
  readonly dto: UpdateInventoryAreaItemDto;
}

export class UpdateInventoryAreaCountDto {
  @ApiPropertyOptional({
    description: 'Id for Inventory-Area entity.',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  readonly inventoryAreaId?: number;

  @ApiProperty({
    description: 'Counted InventoryItems for the InventoryAreaCount.',
    type: [NestedUpdateInventoryAreaItemDto],
    example: [
      {
        id: 1,
        dto: {
          measureUnitId: 4,
          measureAmount: 5,
          inventoryPackageId: 6,
          cost: 7.99,
        },
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  readonly itemCountDtos?: NestedUpdateInventoryAreaItemDto[];
}
