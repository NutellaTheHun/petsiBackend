import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';
import { CreateChildInventoryItemSizeDto } from '../../../inventory-items/dto/inventory-item-size/create-child-inventory-item-size.dto';
import { UpdateChildInventoryItemSizeDto } from '../../../inventory-items/dto/inventory-item-size/update-child-inventory-item-size.dto';
import { InventoryItem } from '../../../inventory-items/entities/inventory-item.entity';

export class UpdateInventoryAreaItemDto {
  @ApiProperty({
    description: 'Id for InventoryItem entity.',
    type: InventoryItem,
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly countedInventoryItemId?: number;

  @ApiProperty({
    description: 'The amount of InventoryItem per unit.',
    example: 6,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly countedAmount?: number;

  @ApiProperty({
    description:
      'Id for InventoryItemSize entity. If countedItemSizeId is populated, countedItemSizeDto must be null/undefined.',
    example: 2,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly countedItemSizeId?: number;

  @ApiProperty({
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
