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
  if (dto.countedAmount !== undefined) {
    entity.amount = dto.countedAmount;
  }

  if (dto.countedInventoryItemId !== undefined && dto.countedInventoryItemId) {
    entity.countedItem = manager.create(InventoryItem, {
      id: dto.countedInventoryItemId,
    });
  }

  if (dto.countedItemSizeDto && dto.countedItemSizeId) {
    throw new Error(
      'Provide either countedItemSizeId OR countedItemSizeDto, not both.',
    );
  }

  if (dto.countedItemSizeDto?.createDto !== undefined) {
    const itemSize = await InventoryItemSizeCreateInTransaction(
      dto.countedItemSizeDto.createDto,
      manager,
    );
    entity.countedItemSize = itemSize;
  }

  if (dto.countedItemSizeId !== undefined && dto.countedItemSizeId) {
    entity.countedItemSize = manager.create(InventoryItemSize, {
      id: dto.countedItemSizeId,
    });
  }
}
