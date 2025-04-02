import { Controller } from "@nestjs/common";
import { ControllerBase } from "../../../base/controller-base";
import { Roles } from "../../../util/decorators/PublicRole";
import { OrderType } from "../entities/order-type.entity";
import { OrderTypeService } from "../services/order-type.service";

@Controller('order-type')
@Roles("staff")
export class OrderTypeController extends ControllerBase<OrderType>{
  constructor(
    private readonly orderTypeService: OrderTypeService
  ) { super(orderTypeService); }
}