import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Controller, Inject } from "@nestjs/common";
import { Cache } from "cache-manager";
import { ControllerBase } from "../../../base/controller-base";
import { Roles } from "../../../util/decorators/PublicRole";
import { RequestContextService } from "../../request-context/RequestContextService";
import { AppLogger } from "../../app-logging/app-logger";
import { MenuItemComponent } from "../entities/menu-item-component.entity";
import { MenuItemComponentService } from "../services/menu-item-component.service";

@Controller('menu-item-component')
@Roles("staff")
export class MenuItemComponentController extends ControllerBase<MenuItemComponent>{
  constructor(
    componentService: MenuItemComponentService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) { super(componentService, cacheManager, 'MenuItemComponentController', requestContextService, logger); }
}