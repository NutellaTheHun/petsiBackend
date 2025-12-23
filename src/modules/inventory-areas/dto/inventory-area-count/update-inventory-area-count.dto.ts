import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { EntityId } from '../../../../common/types';
import { InventoryArea } from '../../entities/inventory-area.entity';
import { NestedInventoryAreaItemDto } from '../inventory-area-item/nested-inventory-area-item.dto';

export class UpdateInventoryAreaCountDto {
  @ApiPropertyOptional({
    description: 'Id for Inventory-Area entity.',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  readonly inventoryAreaId?: EntityId<InventoryArea>;

  @ApiProperty({
    description: 'Counted InventoryItems for the InventoryAreaCount.',
    type: [NestedInventoryAreaItemDto],
    example: [
      {
        mode: 'update',
        id: 1,
        updateDto: {
          countedInventoryItemId: 4,
          amount: 5,
          countedItemSizeId: 6,
        },
      },
    ],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  readonly countedInventoryItems?: NestedInventoryAreaItemDto[];
}
