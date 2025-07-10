import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from 'class-validator';
import { CreateChildInventoryItemSizeDto } from '../../../inventory-items/dto/inventory-item-size/create-child-inventory-item-size.dto';
import { UpdateChildInventoryItemSizeDto } from '../../../inventory-items/dto/inventory-item-size/update-child-inventory-item-size.dto';

export class UpdateChildInventoryAreaItemDto {
  @ApiProperty({
    description:
      'Declare whether creating or updating a child entity. Relevant when creating/updating an Inventory-Area-Count entity.',
    example: 'update',
  })
  @IsNotEmpty()
  readonly mode: 'update' = 'update';

  @ApiProperty({
    description: 'Id of the InventoryAreaItem to update.',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly id: number;

  @ApiPropertyOptional({
    description: 'Id for InventoryItem entity.',
    example: 2,
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
      'Id for InventoryItemSize entity. If countedItemSizeId is null, countedItemSizeDto must be populated.',
    example: 3,
    type: Number,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  readonly countedItemSizeId?: number;

  @ApiPropertyOptional({
    description:
      'Creational or update Dto for InventoryItemSize. If countedItemSizeDto is null, countedItemSizeId must be populated.',
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
