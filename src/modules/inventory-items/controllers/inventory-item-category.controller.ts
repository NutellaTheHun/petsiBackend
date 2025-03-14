import { InventoryItemCategory } from "../entities/inventory-item-category.entity";
import { InventoryItemCategoryService } from "../services/inventory-item-category.service";
import { ControllerBase } from "../../../base/controller-base";
import { Controller } from "@nestjs/common";

@Controller('inventory-item-category')
export class InventoryItemCategoryController extends ControllerBase<InventoryItemCategory> {
    constructor(
      private readonly categoryService: InventoryItemCategoryService
    ){ super(categoryService); }
}