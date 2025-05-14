import { Controller, Inject } from "@nestjs/common";
import { ControllerBase } from "../../../base/controller-base";
import { InventoryItemPackage } from "../entities/inventory-item-package.entity";
import { InventoryItemPackageService } from "../services/inventory-item-package.service";
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Logger } from "nestjs-pino";
import { RequestContextService } from "../../request-context/RequestContextService";
import { ModuleRef } from '@nestjs/core';
import { AppLogger } from "../../app-logging/app-logger";

@Controller('inventory-item-package')
export class InventoryItemPackageController extends ControllerBase<InventoryItemPackage> {
    constructor(

      packageService: InventoryItemPackageService,
      @Inject(CACHE_MANAGER) cacheManager: Cache,
      logger: AppLogger,
      requestContextService: RequestContextService,
    ){ super(packageService, cacheManager, 'InventoryItemPackageController', requestContextService, logger); }
}