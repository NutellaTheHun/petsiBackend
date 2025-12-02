import { EntityManager } from 'typeorm';
import { InventoryItemSizeCreateInTransaction } from '../../../inventory-items/utils/transactions/inventory-item-size.create.transaction';
import { UpdateInventoryAreaItemDto } from '../../dto/inventory-area-item/update-inventory-area-item.dto';
import { InventoryAreaItem } from '../../entities/inventory-area-item.entity';

export async function InventoryAreaItemUpdateInTransaction(
  manager: EntityManager,
  entity: InventoryAreaItem,
  dto: UpdateInventoryAreaItemDto,
): Promise<InventoryAreaItem> {
  if (dto.countedAmount !== undefined) {
    entity.amount = dto.countedAmount;
  }

  if (dto.countedInventoryItemId !== undefined) {
    entity.countedItem = { id: dto.countedInventoryItemId } as any;
  }

  if (dto.countedItemSizeDto && dto.countedItemSizeId) {
    throw new Error(
      'Provide either countedItemSizeId OR countedItemSizeDto, not both.',
    );
  }

  if (dto.countedItemSizeDto?.createDto !== undefined) {
    const itemSize = await InventoryItemSizeCreateInTransaction(
      manager,
      dto.countedItemSizeDto.createDto,
    );
    entity.countedItemSize = itemSize;
  }

  if (dto.countedItemSizeId !== undefined) {
    entity.countedItemSize = { id: dto.countedItemSizeId } as any;
  }

  await manager.save(entity);

  return entity;
}
