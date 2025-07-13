import { ApiPropertyOptional } from '@nestjs/swagger';
import { ValidateNested } from 'class-validator';
import { CreateInventoryAreaItemDto } from './create-inventory-area-item.dto';
import { NestedUpdateInventoryAreaItemDto } from './nested-update-inventory-area-item.dto';
import { UpdateInventoryAreaItemDto } from './update-inventory-area-item.dto';

export class NestedInventoryAreaItemDto {
  @ApiPropertyOptional({
    description: 'CreateInventoryAreaItemDto for InventoryAreaItem entity.',
    type: CreateInventoryAreaItemDto,
    example: {
      measureUnitId: 4,
      measureAmount: 5,
      inventoryPackageId: 6,
      cost: 7.99,
    },
  })
  @ValidateNested()
  readonly create?: CreateInventoryAreaItemDto;

  @ApiPropertyOptional({
    description: 'UpdateInventoryAreaItemDto for InventoryAreaItem entity.',
    type: UpdateInventoryAreaItemDto,
    example: {
      id: 1,
      dto: {
        measureUnitId: 4,
        measureAmount: 5,
        inventoryPackageId: 6,
        cost: 7.99,
      },
    },
  })
  @ValidateNested()
  readonly update?: NestedUpdateInventoryAreaItemDto;
}
