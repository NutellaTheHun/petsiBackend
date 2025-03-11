import { ControllerBase } from "../../../base/controller-base";
import { InventoryItemPackage } from "../entities/inventory-item-package.entity";
import { InventoryItemPackageService } from "../services/inventory-item-package.service";

export class InventoryItemPackageController extends ControllerBase<InventoryItemPackage> {
  constructor(
    private readonly packageService: InventoryItemPackageService
  ){ super(packageService); }
}