import { Controller, Inject } from "@nestjs/common";
import { ControllerBase } from "../../../base/controller-base";
import { InventoryAreaCount } from "../entities/inventory-area-count.entity";
import { InventoryAreaCountService } from "../services/inventory-area-count.service";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";

@Controller('inventory-area-count')
export class InventoryAreaCountController extends ControllerBase<InventoryAreaCount> {
    constructor(
        areaCountService: InventoryAreaCountService,
        @Inject(CACHE_MANAGER) cacheManager: Cache
    ) { super(areaCountService, cacheManager); }
}