import { InventoryItemSize } from "../entities/inventory-item-size.entity";
import { InventoryItemSizeService } from "../services/inventory-item-size.service";
import { ControllerBase } from "../../../base/controller-base";
import { Controller, Inject } from "@nestjs/common";
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from "@nestjs/cache-manager";

@Controller('inventory-item-size')
export class InventoryItemSizeController extends ControllerBase<InventoryItemSize> {
    constructor(
      sizeService: InventoryItemSizeService,
      @Inject(CACHE_MANAGER) cacheManager: Cache
    ){ super(sizeService, cacheManager); }
}