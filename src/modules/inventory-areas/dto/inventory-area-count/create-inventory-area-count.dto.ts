import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { NestedInventoryAreaItemDto } from '../inventory-area-item/nested-inventory-area-item.dto';

export class CreateInventoryAreaCountDto {
  @ApiProperty({
    description: 'Id for InventoryArea entity.',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  readonly inventoryAreaId: number;

  @ApiProperty({
    description: 'Counted InventoryItems for the InventoryAreaCount.',
    type: [NestedInventoryAreaItemDto],
    example: [
      {
        mode: 'create',
        createDto: {
          countedInventoryItemId: 1,
          countedAmount: 2,
          countedItemSizeId: 3,
          countedItemSizeDto: {
            mode: 'create',
            createDto: {
              measureUnitId: 4,
              measureAmount: 5,
              inventoryPackageId: 6,
              cost: 7.99,
            },
          },
        },
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  readonly itemCountDtos?: NestedInventoryAreaItemDto[];
}
