import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Controller, Inject } from "@nestjs/common";
import { Cache } from "cache-manager";
import { ControllerBase } from "../../../base/controller-base";
import { Roles } from "../../../util/decorators/PublicRole";
import { RequestContextService } from "../../request-context/RequestContextService";
import { AppLogger } from "../../app-logging/app-logger";
import { OrderMenuItem } from "../entities/order-menu-item.entity";
import { OrderMenuItemService } from "../services/order-menu-item.service";

@Controller('order-menu-item')
@Roles("staff")
export class OrderMenuItemController extends ControllerBase<OrderMenuItem>{
  constructor(
    orderItemService: OrderMenuItemService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) { super(orderItemService, cacheManager, 'OrderMenuItemController', requestContextService, logger); }
}