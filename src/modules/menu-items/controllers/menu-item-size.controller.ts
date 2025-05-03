import { Controller, Inject } from "@nestjs/common";
import { ControllerBase } from "../../../base/controller-base";
import { Roles } from "../../../util/decorators/PublicRole";
import { MenuItemSize } from "../entities/menu-item-size.entity";
import { MenuItemSizeService } from "../services/menu-item-size.service";
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from "@nestjs/cache-manager";

Controller('menu-item-size')
@Roles("staff")
export class MenuItemSizeController extends ControllerBase<MenuItemSize>{
  constructor(
    sizeService: MenuItemSizeService,
    @Inject(CACHE_MANAGER) cacheManager: Cache
  ) { super(sizeService, cacheManager); }
}