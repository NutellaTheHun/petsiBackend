import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { CreateChildInventoryAreaItemDto } from '../inventory-area-item/create-child-inventory-area-item.dto';

export class CreateInventoryAreaCountDto {
  @ApiProperty({
    description: 'Id for InventoryArea entity.',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  readonly inventoryAreaId: number;

  @ApiProperty({
    description:
      'Child Dtos are used when the the child entity is being created/updated through the parent, in this case, the InventoryAreaItem is being created during the created of the InventoryAreaCount (throught the InventoryAreaCount endpoint).',
    type: [CreateChildInventoryAreaItemDto],
    example: [
      {
        mode: 'create',
        countedInventoryItemId: 1,
        countedAmount: 2,
        countedItemSizeId: 3,
        countedItemSizeDto: {
          mode: 'create',
          measureUnitId: 4,
          measureAmount: 5,
          inventoryPackageId: 6,
          cost: 7.99,
        },
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  readonly itemCountDtos?: CreateChildInventoryAreaItemDto[];
}
