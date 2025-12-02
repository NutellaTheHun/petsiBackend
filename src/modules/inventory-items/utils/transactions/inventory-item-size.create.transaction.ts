import { EntityManager } from 'typeorm';
import { CreateInventoryItemSizeDto } from '../../dto/inventory-item-size/create-inventory-item-size.dto';
import { InventoryItemSize } from '../../entities/inventory-item-size.entity';

export async function InventoryItemSizeCreateInTransaction(
  manager: EntityManager,
  dto: CreateInventoryItemSizeDto,
): Promise<InventoryItemSize> {
  const result = manager.create(InventoryItemSize, {
    measureAmount: dto.measureAmount,
    measureUnit: { id: dto.measureUnitId },
    packageType: { id: dto.inventoryPackageId },
    inventoryItem: { id: dto.inventoryItemId },
    cost: dto.cost.toString(),
  });
  await manager.save(result);
  return result;
}
