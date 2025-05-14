import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Controller, Inject } from "@nestjs/common";
import { Cache } from "cache-manager";
import { ControllerBase } from "../../../base/controller-base";
import { RequestContextService } from "../../request-context/RequestContextService";
import { AppLogger } from "../../app-logging/app-logger";
import { InventoryAreaCount } from "../entities/inventory-area-count.entity";
import { InventoryAreaCountService } from "../services/inventory-area-count.service";

@Controller('inventory-area-count')
export class InventoryAreaCountController extends ControllerBase<InventoryAreaCount> {
    constructor(
        areaCountService: InventoryAreaCountService,
        @Inject(CACHE_MANAGER) cacheManager: Cache,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ) { super(areaCountService, cacheManager, 'InventoryAreaCountController', requestContextService, logger); }
}