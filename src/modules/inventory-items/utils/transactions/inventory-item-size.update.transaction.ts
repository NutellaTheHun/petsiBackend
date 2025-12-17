import { EntityManager } from 'typeorm';
import { UnitOfMeasure } from '../../../unit-of-measure/entities/unit-of-measure.entity';
import { UpdateInventoryItemSizeDto } from '../../dto/inventory-item-size/update-inventory-item-size.dto';
import { InventoryItemPackage } from '../../entities/inventory-item-package.entity';
import { InventoryItemSize } from '../../entities/inventory-item-size.entity';

export async function InventoryItemSizeUpdateInTransaction(
  dto: UpdateInventoryItemSizeDto,
  manager: EntityManager,
  entity: InventoryItemSize,
): Promise<void> {
  if (dto.cost) {
    entity.cost = dto.cost.toString();
  }

  if (dto.packageId !== undefined) {
    entity.package = manager.create(InventoryItemPackage, {
      id: dto.packageId,
    });
  }

  if (dto.measureAmount !== undefined) {
    entity.measureAmount = dto.measureAmount;
  }

  if (dto.measureTypeId !== undefined) {
    entity.measureType = manager.create(UnitOfMeasure, {
      id: dto.measureTypeId,
    });
  }
}
