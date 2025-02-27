import { InventoryItemCategory } from "../entities/inventory-item-category.entity";
import { InventoryItemCategoriesService } from "../services/inventory-items-categories.service";
import { ControllerBase } from "../../../base/controller-base";

export class InventoryItemCategoriesController extends ControllerBase<InventoryItemCategory> {
    constructor(
      categoriesService: InventoryItemCategoriesService
    ){ super(categoriesService); }
}