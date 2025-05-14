import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Controller, Inject } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { Cache } from "cache-manager";
import { ControllerBase } from "../../../base/controller-base";
import { RequestContextService } from "../../request-context/RequestContextService";
import { InventoryArea } from "../entities/inventory-area.entity";
import { InventoryAreaService } from "../services/inventory-area.service";
import { AppLogger } from "../../app-logging/app-logger";

@Controller('inventory-area')
export class InventoryAreaController extends ControllerBase<InventoryArea> {
    constructor(
        areaService: InventoryAreaService,
        @Inject(CACHE_MANAGER) cacheManager: Cache,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ){ super(areaService, cacheManager, 'InventoryAreaController', requestContextService, logger); }
}