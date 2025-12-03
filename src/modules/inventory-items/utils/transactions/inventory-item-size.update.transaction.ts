import { EntityManager } from 'typeorm';
import { UnitOfMeasure } from '../../../unit-of-measure/entities/unit-of-measure.entity';
import { UpdateInventoryItemSizeDto } from '../../dto/inventory-item-size/update-inventory-item-size.dto';
import { InventoryItemPackage } from '../../entities/inventory-item-package.entity';
import { InventoryItemSize } from '../../entities/inventory-item-size.entity';

export async function InventoryItemSizeUpdateInTransaction(
  manager: EntityManager,
  entity: InventoryItemSize,
  dto: UpdateInventoryItemSizeDto,
): Promise<InventoryItemSize> {
  if (dto.cost) {
    entity.cost = dto.cost.toString();
  }

  if (dto.inventoryPackageId) {
    entity.packageType = manager.create(InventoryItemPackage, {
      id: dto.inventoryPackageId,
    });
  }

  if (dto.measureAmount) {
    entity.measureAmount = dto.measureAmount;
  }

  if (dto.measureUnitId) {
    entity.measureUnit = manager.create(UnitOfMeasure, {
      id: dto.measureUnitId,
    });
  }

  await manager.save(entity);
  return entity;
}
