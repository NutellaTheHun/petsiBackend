import { Controller } from "@nestjs/common";
import { ControllerBase } from "../../../base/controller-base";
import { Roles } from "../../../util/decorators/PublicRole";
import { MenuItem } from "../entities/menu-item.entity";
import { MenuItemService } from "../services/menu-item.service";

Controller('menu-item-size')
@Roles("staff")
export class MenuItemController extends ControllerBase<MenuItem>{
  constructor(
    private readonly itemService: MenuItemService
  ) { super(itemService); }
}