import { ControllerBase } from "../../../base/controller-base";
import { InventoryItemPackage } from "../entities/inventory-item-package.entity";
import { InventoryItemPackagesService } from "../services/inventory-items-packages.service";

export class InventoryItemPackagesController extends ControllerBase<InventoryItemPackage> {
  constructor(
    packagesService: InventoryItemPackagesService
  ){ super(packagesService); }
}