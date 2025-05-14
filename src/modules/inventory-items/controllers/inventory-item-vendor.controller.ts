import { Controller, Inject } from "@nestjs/common";
import { InventoryItemVendor } from "../entities/inventory-item-vendor.entity";
import { InventoryItemVendorService } from "../services/inventory-item-vendor.service";
import { ControllerBase } from "../../../base/controller-base";
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Logger } from "nestjs-pino";
import { RequestContextService } from "../../request-context/RequestContextService";
import { ModuleRef } from '@nestjs/core';
import { AppLogger } from "../../app-logging/app-logger";

@Controller('inventory-item-vendor')
export class InventoryItemVendorController extends ControllerBase<InventoryItemVendor> {
    constructor(
        vendorService: InventoryItemVendorService,
        @Inject(CACHE_MANAGER) cacheManager: Cache,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ){ super(vendorService, cacheManager, 'InventoryItemVendorController', requestContextService, logger); }
}