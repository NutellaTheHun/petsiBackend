import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';
import { NestedInventoryItemSizeDto } from '../../../inventory-items/dto/inventory-item-size/nested-inventory-item-size.dto';

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
  readonly countedAmount: number;

  @ApiPropertyOptional({
    description:
      'Id for InventoryItemSize entity. If countedItemSizeId is populated, countedItemSizeDto must be null/undefined.',
    example: 2,
    type: Number,
    nullable: true,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly countedItemSizeId?: number | null;

  @ApiPropertyOptional({
    description:
      'If countedItemSizeDto is populated, countedItemSizeId must be null/undefined.',
    type: NestedInventoryItemSizeDto,
    example: {
      mode: 'update',
      id: 5,
      updateDto: {
        measureUnitId: 1,
        measureAmount: 2,
        inventoryPackageId: 3,
        cost: 4,
      },
    },
    nullable: true,
  })
  @IsOptional()
  readonly countedItemSizeDto?: NestedInventoryItemSizeDto | null;
}
