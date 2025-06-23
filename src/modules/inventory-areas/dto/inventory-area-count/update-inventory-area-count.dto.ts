import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateInventoryAreaCountDto {
  @ApiPropertyOptional({
    description: 'Id for Inventory-Area entity.',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  readonly inventoryAreaId?: number;

  /*@ApiPropertyOptional({
    description:
      'Child Dtos are used when the the child entity is being created/updated through the parent, in this case, the InventoryAreaItem is being created or updated during the update request of the InventoryAreaCount (throught the InventoryAreaCount endpoint).',
    type: [UpdateChildInventoryAreaItemDto],
    example: [
      {
        mode: 'update',
        id: 1,
        countedInventoryItemId: 2,
        countedAmount: 3,
        countedItemSizeId: 4,
        countedItemSizeDto: {
          mode: 'update',
          id: 5,
          measureUnitId: 6,
          measureAmount: 7,
          inventoryPackageId: 8,
          cost: 9.99,
        },
      },
      {
        mode: 'create',
        countedInventoryItemId: 10,
        countedAmount: 11,
        countedItemSizeId: 12,
        countedItemSizeDto: {
          mode: 'create',
          measureUnitId: 13,
          measureAmount: 14,
          inventoryPackageId: 15,
          cost: 16.99,
        },
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InventoryAreaItemUnionResolver)
  readonly itemCountDtos?: (
    | CreateChildInventoryAreaItemDto
    | UpdateChildInventoryAreaItemDto
  )[];*/
}
