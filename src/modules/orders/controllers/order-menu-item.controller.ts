import { Controller, Inject } from "@nestjs/common";
import { ControllerBase } from "../../../base/controller-base";
import { Roles } from "../../../util/decorators/PublicRole";
import { OrderMenuItem } from "../entities/order-menu-item.entity";
import { OrderMenuItemService } from "../services/order-menu-item.service";
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Logger } from "nestjs-pino";

@Controller('order-menu-item')
@Roles("staff")
export class OrderMenuItemController extends ControllerBase<OrderMenuItem>{
  constructor(
    orderItemService: OrderMenuItemService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    @Inject(Logger)logger: Logger,
  ) { super(orderItemService, cacheManager, logger); }
}