import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { EntityId } from '../../../../common/types';
import { InventoryArea } from '../../entities/inventory-area.entity';
import { NestedInventoryAreaItemDto } from '../inventory-area-item/nested-inventory-area-item.dto';

export class CreateInventoryAreaCountDto {
  @ApiProperty({
    description: 'Id for InventoryArea entity.',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  readonly inventoryAreaId: EntityId<InventoryArea>;

  @ApiProperty({
    description: 'Counted InventoryItems for the InventoryAreaCount.',
    type: [NestedInventoryAreaItemDto],
    example: [
      {
        mode: 'create',
        createId: 'c132',
        createDto: {
          countedInventoryItemId: 1,
          amount: 2,
          parentInventoryCountId: 3,
          countedItemSizeDto: {
            mode: 'create',
            createId: 'c5325',
            createDto: {
              inventoryItemId: 4,
              measureTypeId: 5,
              measureAmount: 6,
              packageId: 7,
              cost: 8.99,
            },
          },
        },
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  readonly countedInventoryItems?: NestedInventoryAreaItemDto[];
}
