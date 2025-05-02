import { Controller, Inject } from "@nestjs/common";
import { ControllerBase } from "../../../base/controller-base";
import { Roles } from "../../../util/decorators/PublicRole";
import { OrderType } from "../entities/order-type.entity";
import { OrderTypeService } from "../services/order-type.service";
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from "@nestjs/cache-manager";

@Controller('order-type')
@Roles("staff")
export class OrderTypeController extends ControllerBase<OrderType>{
  constructor(
    orderTypeService: OrderTypeService,
    @Inject(CACHE_MANAGER) cacheManager: Cache
  ) { super(orderTypeService, cacheManager); }
}