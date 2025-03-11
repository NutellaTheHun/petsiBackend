import { InventoryItemCategory } from "../entities/inventory-item-category.entity";
import { InventoryItemCategoryService } from "../services/inventory-item-category.service";
import { ControllerBase } from "../../../base/controller-base";

export class InventoryItemCategoryController extends ControllerBase<InventoryItemCategory> {
    constructor(
      private readonly categoryService: InventoryItemCategoryService
    ){ super(categoryService); }
}