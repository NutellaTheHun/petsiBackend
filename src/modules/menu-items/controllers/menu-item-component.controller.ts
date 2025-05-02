import { Controller, Inject } from "@nestjs/common";
import { ControllerBase } from "../../../base/controller-base";
import { Roles } from "../../../util/decorators/PublicRole";
import { MenuItemComponent } from "../entities/menu-item-component.entity";
import { MenuItemComponentService } from "../services/menu-item-component.service";
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from "@nestjs/cache-manager";

@Controller('menu-item-component')
@Roles("staff")
export class MenuItemComponentController extends ControllerBase<MenuItemComponent>{
  constructor(
    componentService: MenuItemComponentService,
    @Inject(CACHE_MANAGER) cacheManager: Cache
  ) { super(componentService, cacheManager); }
}