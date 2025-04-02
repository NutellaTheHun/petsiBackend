import { Controller } from "@nestjs/common";
import { ControllerBase } from "../../../base/controller-base";
import { Roles } from "../../../util/decorators/PublicRole";
import { Order } from "../entities/order.entity";
import { OrderService } from "../services/order.service";

@Controller('order')
@Roles("staff")
export class OrderController extends ControllerBase<Order>{
  constructor(
    private readonly orderService: OrderService
  ) { super(orderService); }
}