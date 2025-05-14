import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Controller, Inject } from "@nestjs/common";
import { Cache } from "cache-manager";
import { ControllerBase } from "../../../base/controller-base";
import { Roles } from "../../../util/decorators/PublicRole";
import { RequestContextService } from "../../request-context/RequestContextService";
import { AppLogger } from "../../app-logging/app-logger";
import { OrderType } from "../entities/order-type.entity";
import { OrderTypeService } from "../services/order-type.service";

@Controller('order-type')
@Roles("staff")
export class OrderTypeController extends ControllerBase<OrderType>{
  constructor(
    orderTypeService: OrderTypeService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) { super(orderTypeService, cacheManager, 'OrderTypeController', requestContextService, logger); }
}