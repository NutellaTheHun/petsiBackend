import { Controller, Inject } from "@nestjs/common";
import { ControllerBase } from "../../../base/controller-base";
import { InventoryItemPackage } from "../entities/inventory-item-package.entity";
import { InventoryItemPackageService } from "../services/inventory-item-package.service";
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Logger } from "nestjs-pino";


@Controller('inventory-item-package')
export class InventoryItemPackageController extends ControllerBase<InventoryItemPackage> {
    constructor(
      packageService: InventoryItemPackageService,
      @Inject(CACHE_MANAGER) cacheManager: Cache,
      @Inject(Logger)logger: Logger,
    ){ super(packageService, cacheManager, logger); }
}