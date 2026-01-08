import {
  ApiProperty,
  ApiPropertyOptional,
  getSchemaPath,
} from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { EntityId } from '../../../../common/types';
import { InventoryArea } from '../../entities/inventory-area.entity';
import { NestedCreateInventoryAreaItemDto } from '../inventory-area-item/nested-create-inventory-area-item.dto copy';
import { NestedUpdateInventoryAreaItemDto } from '../inventory-area-item/nested-update-inventory-area-item.dto';

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
    type: 'array',
    oneOf: [
      { $ref: getSchemaPath(NestedCreateInventoryAreaItemDto) },
      { $ref: getSchemaPath(NestedUpdateInventoryAreaItemDto) },
    ],
    example: [
      {
        id: 1,
        countedInventoryItemId: 4,
        amount: 5,
        countedItemSizeId: 6,
      },
    ],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  readonly countedInventoryItems?: (
    | NestedCreateInventoryAreaItemDto
    | NestedUpdateInventoryAreaItemDto
  )[];
}
