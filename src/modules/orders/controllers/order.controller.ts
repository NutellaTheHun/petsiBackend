import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Controller, Inject } from "@nestjs/common";
import { Cache } from "cache-manager";
import { ControllerBase } from "../../../base/controller-base";
import { Roles } from "../../../util/decorators/PublicRole";
import { RequestContextService } from "../../request-context/RequestContextService";
import { AppLogger } from "../../app-logging/app-logger";
import { Order } from "../entities/order.entity";
import { OrderService } from "../services/order.service";

@Controller('order')
@Roles("staff")
export class OrderController extends ControllerBase<Order>{
  constructor(
    orderService: OrderService, 
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) { super( orderService, cacheManager, 'OrderController', requestContextService, logger); }
}