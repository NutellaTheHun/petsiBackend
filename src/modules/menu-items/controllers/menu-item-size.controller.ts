import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Controller, Inject } from "@nestjs/common";
import { Cache } from "cache-manager";
import { ControllerBase } from "../../../base/controller-base";
import { Roles } from "../../../util/decorators/PublicRole";
import { RequestContextService } from "../../request-context/RequestContextService";
import { AppLogger } from "../../app-logging/app-logger";
import { MenuItemSize } from "../entities/menu-item-size.entity";
import { MenuItemSizeService } from "../services/menu-item-size.service";

Controller('menu-item-size')
@Roles("staff")
export class MenuItemSizeController extends ControllerBase<MenuItemSize>{
  constructor(
    sizeService: MenuItemSizeService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) { super(sizeService, cacheManager, 'MenuItemSizeController', requestContextService, logger); }
}