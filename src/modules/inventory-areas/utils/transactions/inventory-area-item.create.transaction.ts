import { EntityManager } from 'typeorm';
import { InventoryItemSize } from '../../../inventory-items/entities/inventory-item-size.entity';
import { InventoryItemSizeCreateInTransaction } from '../../../inventory-items/utils/transactions/inventory-item-size.create.transaction';
import { CreateInventoryAreaItemDto } from '../../dto/inventory-area-item/create-inventory-area-item.dto';
import { InventoryAreaItem } from '../../entities/inventory-area-item.entity';

export async function InventoryAreaItemCreateInTransaction(
  dto: CreateInventoryAreaItemDto,
  manager: EntityManager,
): Promise<InventoryAreaItem> {
  let countedItemSize: InventoryItemSize;
  if (dto.countedItemSizeId !== undefined && dto.countedItemSizeId) {
    countedItemSize = manager.create(InventoryItemSize, {
      id: dto.countedItemSizeId,
    });
  } else if (dto.countedItemSizeDto?.createDto) {
    countedItemSize = await InventoryItemSizeCreateInTransaction(
      dto.countedItemSizeDto.createDto,
      manager,
    );
  } else {
    throw new Error(
      'Create InventoryAreaItem: Either countedItemSizeId or countedItemSizeDto must be provided.',
    );
  }

  const result = manager.create(InventoryAreaItem, {
    ...(dto.parentInventoryCountId && {
      parentInventoryCount: { id: dto.parentInventoryCountId },
    }),
    countedItem: { id: dto.countedInventoryItemId },
    amount: dto.countedAmount,
    countedItemSize,
  });

  return result;
}
