import { InventoryItemCategory } from "../entities/inventory-item-category.entity";
import { InventoryItemCategoryService } from "../services/inventory-item-category.service";
import { ControllerBase } from "../../../base/controller-base";

export class InventoryItemCategoriesController extends ControllerBase<InventoryItemCategory> {
    constructor(
      categoriesService: InventoryItemCategoryService
    ){ super(categoriesService); }
}