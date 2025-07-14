import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { CreateInventoryItemSizeDto } from './create-inventory-item-size.dto';
import { NestedUpdateInventoryItemSizeDto } from './nested-update-inventory-item-size.dto';

export class NestedInventoryItemSizeDto {
  @ApiProperty({
    description: 'CreateInventoryItemSizeDto for InventoryItemSize entity.',
    type: CreateInventoryItemSizeDto,
    example: {
      measureUnitId: 1,
      measureAmount: 10,
      inventoryPackageId: 1,
      cost: 100,
    },
  })
  @IsNumber()
  readonly create?: CreateInventoryItemSizeDto;

  @ApiProperty({
    description: 'UpdateInventoryItemSizeDto for InventoryItemSize entity.',
    type: NestedUpdateInventoryItemSizeDto,
    example: {
      measureUnitId: 1,
      measureAmount: 10,
      inventoryPackageId: 1,
      cost: 100,
    },
  })
  @IsNumber()
  readonly update?: NestedUpdateInventoryItemSizeDto;
}
