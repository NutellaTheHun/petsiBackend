import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Controller, Inject } from '@nestjs/common';
import { Cache } from "cache-manager";
import { ControllerBase } from "../../../base/controller-base";
import { RequestContextService } from '../../request-context/RequestContextService';
import { AppLogger } from '../../app-logging/app-logger';
import { InventoryItem } from "../entities/inventory-item.entity";
import { InventoryItemService } from "../services/inventory-item.service";

@Controller('inventory-item')
export class InventoryItemController extends ControllerBase<InventoryItem> {
    constructor(
        itemService: InventoryItemService,
        @Inject(CACHE_MANAGER) cacheManager: Cache,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ){ super(itemService, cacheManager, 'InventoryItemController', requestContextService, logger); }
}