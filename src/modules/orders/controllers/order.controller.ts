import { Controller, Inject } from "@nestjs/common";
import { ControllerBase } from "../../../base/controller-base";
import { Roles } from "../../../util/decorators/PublicRole";
import { Order } from "../entities/order.entity";
import { OrderService } from "../services/order.service";
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Logger } from "nestjs-pino";

@Controller('order')
@Roles("staff")
export class OrderController extends ControllerBase<Order>{
  constructor(
    orderService: OrderService, 
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    @Inject(Logger)logger: Logger,
  ) { super(orderService, cacheManager, logger); }
}