import { Controller, Inject } from "@nestjs/common";
import { ControllerBase } from "../../../base/controller-base";
import { Roles } from "../../../util/decorators/PublicRole";
import { MenuItemCategory } from "../entities/menu-item-category.entity";
import { MenuItemCategoryService } from "../services/menu-item-category.service";
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Logger } from "nestjs-pino";
import { RequestContextService } from "../../request-context/RequestContextService";
import { ModuleRef } from "@nestjs/core";
import { AppLogger } from "../../app-logging/app-logger";

@Controller('menu-category')
@Roles("staff")
export class MenuItemCategoryController extends ControllerBase<MenuItemCategory>{
  constructor(
    categoryService: MenuItemCategoryService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) { super(categoryService, cacheManager, 'MenuItemCategoryController', requestContextService, logger); }
}