import { Controller, Inject } from "@nestjs/common";
import { ControllerBase } from "../../../base/controller-base";
import { Roles } from "../../../util/decorators/PublicRole";
import { MenuItem } from "../entities/menu-item.entity";
import { MenuItemService } from "../services/menu-item.service";
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Logger } from "nestjs-pino";

Controller('menu-item-size')
@Roles("staff")
export class MenuItemController extends ControllerBase<MenuItem>{
  constructor(
    itemService: MenuItemService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    @Inject(Logger)logger: Logger,
  ) { super(itemService, cacheManager, logger); }
}