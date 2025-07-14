import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, ValidateNested } from 'class-validator';
import { UpdateInventoryItemSizeDto } from './update-inventory-item-size.dto';

export class NestedUpdateInventoryItemSizeDto {
  @ApiProperty({
    description: 'Id of InventoryItemSize entity.',
    example: 1,
  })
  @IsNumber()
  readonly id: number;

  @ApiProperty({
    description: 'UpdateInventoryItemSizeDto for InventoryItemSize entity.',
    type: UpdateInventoryItemSizeDto,
    example: {
      measureUnitId: 1,
      measureAmount: 10,
      inventoryPackageId: 1,
      cost: 100,
    },
  })
  @ValidateNested()
  readonly dto: UpdateInventoryItemSizeDto;
}
