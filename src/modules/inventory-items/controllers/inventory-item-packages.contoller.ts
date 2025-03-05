import { ControllerBase } from "../../../base/controller-base";
import { InventoryItemPackage } from "../entities/inventory-item-package.entity";
import { InventoryItemPackageService } from "../services/inventory-item-package.service";

export class InventoryItemPackagesController extends ControllerBase<InventoryItemPackage> {
  constructor(
    packagesService: InventoryItemPackageService
  ){ super(packagesService); }
}