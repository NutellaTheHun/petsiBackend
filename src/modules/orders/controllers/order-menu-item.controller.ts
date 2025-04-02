import { Controller } from "@nestjs/common";
import { ControllerBase } from "../../../base/controller-base";
import { Roles } from "../../../util/decorators/PublicRole";
import { OrderMenuItem } from "../entities/order-menu-item.entity";
import { OrderMenuItemService } from "../services/order-menu-item.service";

@Controller('order-menu-item')
@Roles("staff")
export class OrderMenuItemController extends ControllerBase<OrderMenuItem>{
  constructor(
    private readonly orderItemService: OrderMenuItemService
  ) { super(orderItemService); }
}