import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';
import { CreateChildInventoryItemSizeDto } from '../../../inventory-items/dto/inventory-item-size/create-child-inventory-item-size.dto';
import { UpdateChildInventoryItemSizeDto } from '../../../inventory-items/dto/inventory-item-size/update-child-inventory-item-size.dto';

export class UpdateInventoryAreaItemDto {
  @ApiPropertyOptional({
    description: 'Id for InventoryItem entity.',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly countedInventoryItemId?: number;

  @ApiPropertyOptional({
    description: 'The amount of InventoryItem per unit.',
    example: 6,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly countedAmount?: number;

  @ApiPropertyOptional({
    description:
      'Id for InventoryItemSize entity. If countedItemSizeId is populated, countedItemSizeDto must be null/undefined.',
    example: 2,
    type: Number,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly countedItemSizeId?: number;

  @ApiPropertyOptional({
    description:
      'If countedItemSizeDto is populated, countedItemSizeId must be null/undefined.',
    type: UpdateChildInventoryItemSizeDto,
    example: {
      mode: 'update',
      id: 5,
      measureUnitId: 1,
      measureAmount: 2,
      inventoryPackageId: 3,
      cost: 4.99,
    },
  })
  @IsOptional()
  readonly countedItemSizeDto?:
    | CreateChildInventoryItemSizeDto
    | UpdateChildInventoryItemSizeDto;
}
