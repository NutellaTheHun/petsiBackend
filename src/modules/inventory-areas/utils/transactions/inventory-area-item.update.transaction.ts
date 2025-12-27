import { EntityManager } from 'typeorm';
import { InventoryItemSize } from '../../../inventory-items/entities/inventory-item-size.entity';
import { InventoryItem } from '../../../inventory-items/entities/inventory-item.entity';
import { InventoryItemSizeCreateInTransaction } from '../../../inventory-items/utils/transactions/inventory-item-size.create.transaction';
import { UpdateInventoryAreaItemDto } from '../../dto/inventory-area-item/update-inventory-area-item.dto';
import { InventoryAreaItem } from '../../entities/inventory-area-item.entity';

export async function InventoryAreaItemUpdateInTransaction(
  dto: UpdateInventoryAreaItemDto,
  manager: EntityManager,
  entity: InventoryAreaItem,
): Promise<void> {
  if (dto.amount !== undefined) {
    entity.amount = dto.amount;
  }

  if (dto.countedInventoryItemId !== undefined) {
    entity.countedInventoryItem = manager.create(InventoryItem, {
      id: dto.countedInventoryItemId,
    });
  }

  if (dto.countedItemSize && dto.countedItemSizeId) {
    throw new Error(
      'Provide either countedItemSizeId OR countedItemSizeDto, not both.',
    );
  }

  if (dto.countedItemSize?.createDto !== undefined) {
    const itemSize = await InventoryItemSizeCreateInTransaction(
      dto.countedItemSize.createDto,
      manager,
    );
    entity.countedItemSize = itemSize;
  }

  if (dto.countedItemSizeId !== undefined) {
    entity.countedItemSize = manager.create(InventoryItemSize, {
      id: dto.countedItemSizeId,
    });
  }
}
