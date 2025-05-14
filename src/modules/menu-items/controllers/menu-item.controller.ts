import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Controller, Inject } from "@nestjs/common";
import { Cache } from "cache-manager";
import { ControllerBase } from "../../../base/controller-base";
import { Roles } from "../../../util/decorators/PublicRole";
import { RequestContextService } from "../../request-context/RequestContextService";
import { AppLogger } from "../../app-logging/app-logger";
import { MenuItem } from "../entities/menu-item.entity";
import { MenuItemService } from "../services/menu-item.service";

Controller('menu-item-size')
@Roles("staff")
export class MenuItemController extends ControllerBase<MenuItem>{
  constructor(
    itemService: MenuItemService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) { super(itemService, cacheManager, 'MenuItemController', requestContextService, logger); }
}