import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, ValidateNested } from 'class-validator';
import { NestedDtoBase } from '../../../../base/nested-dto-base';
import { CreateInventoryAreaItemDto } from './create-inventory-area-item.dto';
import { UpdateInventoryAreaItemDto } from './update-inventory-area-item.dto';

export class NestedInventoryAreaItemDto extends NestedDtoBase<
  CreateInventoryAreaItemDto,
  UpdateInventoryAreaItemDto
> {
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
  @IsOptional()
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
  @IsOptional()
  readonly updateDto?: UpdateInventoryAreaItemDto;
}
