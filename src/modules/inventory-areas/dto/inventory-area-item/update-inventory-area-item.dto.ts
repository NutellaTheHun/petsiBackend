import { ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';
import { EntityId } from '../../../../common/types';
import { NestedCreateInventoryItemSizeDto } from '../../../inventory-items/dto/inventory-item-size/nested-create-inventory-item-size.dto';
import { NestedUpdateInventoryItemSizeDto } from '../../../inventory-items/dto/inventory-item-size/nested-update-inventory-item-size.dto';
import { InventoryItemSize } from '../../../inventory-items/entities/inventory-item-size.entity';
import { InventoryItem } from '../../../inventory-items/entities/inventory-item.entity';

export class UpdateInventoryAreaItemDto {
  @ApiPropertyOptional({
    description: 'Id for InventoryItem entity.',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly countedInventoryItemId?: EntityId<InventoryItem>;

  @ApiPropertyOptional({
    description: 'The amount of InventoryItem per unit.',
    example: 6,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly amount?: number;

  @ApiPropertyOptional({
    description:
      'Id for InventoryItemSize entity. If countedItemSizeId is populated, countedItemSizeDto must be null/undefined.',
    example: 2,
    type: Number,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly countedItemSizeId?: EntityId<InventoryItemSize>;

  @ApiPropertyOptional({
    description:
      'If countedItemSizeDto is populated, countedItemSizeId must be null/undefined.',
      oneOf:[
        { $ref: getSchemaPath(NestedCreateInventoryItemSizeDto)},
        { $ref: getSchemaPath(NestedUpdateInventoryItemSizeDto)},
      ],
    type: Object,
    example: {
        id: 5,
        measureTypeId: 1,
        measureAmount: 2,
        packageId: 3,
        cost: 4,
    },
  })
  @IsOptional()
  readonly countedItemSize?: NestedCreateInventoryItemSizeDto | NestedUpdateInventoryItemSizeDto;
}
