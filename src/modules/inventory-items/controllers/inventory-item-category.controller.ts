import { InventoryItemCategory } from "../entities/inventory-item-category.entity";
import { InventoryItemCategoryService } from "../services/inventory-item-category.service";
import { ControllerBase } from "../../../base/controller-base";
import { Controller, Inject } from "@nestjs/common";
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Logger } from "nestjs-pino";
import { RequestContextService } from "../../request-context/RequestContextService";
import { ModuleRef } from '@nestjs/core';
import { AppLogger } from "../../app-logging/app-logger";

@Controller('inventory-item-category')
export class InventoryItemCategoryController extends ControllerBase<InventoryItemCategory> {
    constructor(
      categoryService: InventoryItemCategoryService,
      @Inject(CACHE_MANAGER) cacheManager: Cache,
      logger: AppLogger,
      requestContextService: RequestContextService,
    ){ super(categoryService, cacheManager, 'InventoryItemCategoryController', requestContextService, logger); }
}