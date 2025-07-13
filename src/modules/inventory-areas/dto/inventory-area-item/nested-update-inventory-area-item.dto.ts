import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, ValidateNested } from 'class-validator';
import { UpdateInventoryAreaItemDto } from './update-inventory-area-item.dto';

export class NestedUpdateInventoryAreaItemDto {
  @ApiProperty({
    description: 'Id for InventoryAreaItem entity.',
    example: 1,
  })
  @IsNumber()
  readonly id: number;

  @ApiProperty({
    description: 'UpdateInventoryAreaItemDto for InventoryAreaItem entity.',
    type: UpdateInventoryAreaItemDto,
    example: {
      measureUnitId: 4,
      measureAmount: 5,
      inventoryPackageId: 6,
      cost: 7.99,
    },
  })
  @ValidateNested()
  readonly dto: UpdateInventoryAreaItemDto;
}
