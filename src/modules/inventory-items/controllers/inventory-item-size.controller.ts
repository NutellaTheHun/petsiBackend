import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Controller, Inject } from "@nestjs/common";
import { Cache } from "cache-manager";
import { ControllerBase } from "../../../base/controller-base";
import { RequestContextService } from "../../request-context/RequestContextService";
import { AppLogger } from "../../app-logging/app-logger";
import { InventoryItemSize } from "../entities/inventory-item-size.entity";
import { InventoryItemSizeService } from "../services/inventory-item-size.service";

@Controller('inventory-item-size')
export class InventoryItemSizeController extends ControllerBase<InventoryItemSize> {
    constructor(

      sizeService: InventoryItemSizeService,
      @Inject(CACHE_MANAGER) cacheManager: Cache,
      logger: AppLogger,
      requestContextService: RequestContextService,
    ){ super(sizeService, cacheManager, 'InventoryItemSizeController', requestContextService, logger); }
}