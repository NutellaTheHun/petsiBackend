import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Controller, Inject } from "@nestjs/common";
import { Cache } from "cache-manager";
import { ControllerBase } from "../../../base/controller-base";
import { RequestContextService } from "../../request-context/RequestContextService";
import { AppLogger } from "../../app-logging/app-logger";
import { InventoryAreaItem } from "../entities/inventory-area-item.entity";
import { InventoryAreaItemService } from "../services/inventory-area-item.service";

@Controller('inventory-area-item')
export class InventoryAreaItemController extends ControllerBase<InventoryAreaItem> {
    constructor(
        itemCountService: InventoryAreaItemService,
        @Inject(CACHE_MANAGER) cacheManager: Cache,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ){ super(itemCountService, cacheManager, 'InventoryAreaItemController', requestContextService, logger); }
}