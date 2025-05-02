import { Controller, Inject } from '@nestjs/common';
import { InventoryItemService } from "../services/inventory-item.service";
import { ControllerBase } from "../../../base/controller-base";
import { InventoryItem } from "../entities/inventory-item.entity";
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from "cache-manager";

@Controller('inventory-item')
export class InventoryItemController extends ControllerBase<InventoryItem> {
    constructor(
        itemService: InventoryItemService,
        @Inject(CACHE_MANAGER) cacheManager: Cache
    ){ super(itemService, cacheManager); }
}
