import { Controller, Inject } from "@nestjs/common";
import { ControllerBase } from "../../../base/controller-base";
import { Roles } from "../../../util/decorators/PublicRole";
import { OrderType } from "../entities/order-type.entity";
import { OrderTypeService } from "../services/order-type.service";
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Logger } from "nestjs-pino";

@Controller('order-type')
@Roles("staff")
export class OrderTypeController extends ControllerBase<OrderType>{
  constructor(
    orderTypeService: OrderTypeService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    @Inject(Logger)logger: Logger,
  ) { super(orderTypeService, cacheManager, logger); }
}