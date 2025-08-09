import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { NestedInventoryAreaItemDto } from '../inventory-area-item/nested-inventory-area-item.dto';

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
    type: [NestedInventoryAreaItemDto],
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
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  readonly itemCountDtos?: NestedInventoryAreaItemDto[];
}
