import { EntityManager } from 'typeorm';
import { InventoryItemSize } from '../../../inventory-items/entities/inventory-item-size.entity';
import { CreateInventoryAreaItemDto } from '../../dto/inventory-area-item/create-inventory-area-item.dto';
import { InventoryAreaItem } from '../../entities/inventory-area-item.entity';

export async function InventoryAreaItemCreateInTransaction(
  manager: EntityManager,
  dto: CreateInventoryAreaItemDto,
): Promise<InventoryAreaItem> {
  let countedItemSize: InventoryItemSize;
  if (dto.countedItemSizeId) {
    countedItemSize = manager.create(InventoryItemSize, {
      id: dto.countedItemSizeId,
    });
  } else if (dto.countedItemSizeDto?.createDto) {
    const newSizeDto = dto.countedItemSizeDto.createDto;
    countedItemSize = manager.create(InventoryItemSize, {
      measureAmount: newSizeDto.measureAmount,
      measureUnit: { id: newSizeDto.measureUnitId },
      packageType: { id: newSizeDto.inventoryPackageId },
      inventoryItem: { id: newSizeDto.inventoryItemId },
      cost: newSizeDto.cost.toString(),
    });
    await manager.save(countedItemSize);
  } else {
    throw new Error(
      'Either countedItemSizeId or countedItemSizeDto must be provided.',
    );
  }

  const result = manager.create(InventoryAreaItem, {
    parentInventoryCount: { id: dto.parentInventoryCountId },
    countedItem: { id: dto.countedInventoryItemId },
    amount: dto.countedAmount,
    countedItemSize,
  });

  await manager.save(result);
  return result;
}
