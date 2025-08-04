import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, ValidateNested } from 'class-validator';
import { CreateInventoryAreaItemDto } from './create-inventory-area-item.dto';
import { UpdateInventoryAreaItemDto } from './update-inventory-area-item.dto';

export class NestedInventoryAreaItemDto {
  @ApiProperty({
    description: 'Determines if this dto is to update or create a resource',
    example: 'create',
  })
  readonly mode: 'create' | 'update';

  @ApiProperty({
    description: 'Id for InventoryAreaItem entity when updating',
    example: 1,
  })
  @IsNumber()
  readonly id?: number;

  @ApiPropertyOptional({
    description: 'CreateInventoryAreaItemDto for InventoryAreaItem entity.',
    type: CreateInventoryAreaItemDto,
    example: {
      parentInventoryCountId: 1,
      countedInventoryItemId: 2,
      countedAmount: 3,
      countedItemSizeId: 4,
      countedItemSizeDto: {
        inventoryItemId: 1,
        measureUnitId: 2,
        measureAmount: 3,
        inventoryPackageId: 4,
        cost: 5,
      },
    },
  })
  @ValidateNested()
  readonly createDto?: CreateInventoryAreaItemDto;

  @ApiPropertyOptional({
    description: 'UpdateInventoryAreaItemDto for InventoryAreaItem entity.',
    type: UpdateInventoryAreaItemDto,
    example: {
      countedInventoryItemId: 1,
      countedAmount: 2,
      countedItemSizeId: 3,
      countedItemSizeDto: {
        mode: 'create',
        createDto: {
          inventoryItemId: 1,
          measureUnitId: 2,
          measureAmount: 3,
          inventoryPackageId: 4,
          cost: 5.99,
        },
      },
    },
  })
  @ValidateNested()
  readonly updateDto?: UpdateInventoryAreaItemDto;
}
