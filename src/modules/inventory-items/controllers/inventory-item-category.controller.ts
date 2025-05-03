import { InventoryItemCategory } from "../entities/inventory-item-category.entity";
import { InventoryItemCategoryService } from "../services/inventory-item-category.service";
import { ControllerBase } from "../../../base/controller-base";
import { Controller, Inject } from "@nestjs/common";
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from "@nestjs/cache-manager";

@Controller('inventory-item-category')
export class InventoryItemCategoryController extends ControllerBase<InventoryItemCategory> {
    constructor(
      categoryService: InventoryItemCategoryService,
      @Inject(CACHE_MANAGER) cacheManager: Cache
    ){ super(categoryService, cacheManager); }
}