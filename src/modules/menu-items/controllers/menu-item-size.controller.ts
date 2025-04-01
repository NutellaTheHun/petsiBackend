import { Controller } from "@nestjs/common";
import { ControllerBase } from "../../../base/controller-base";
import { Roles } from "../../../util/decorators/PublicRole";
import { MenuItemSize } from "../entities/menu-item-size.entity";
import { MenuItemSizeService } from "../services/menu-item-size.service";

Controller('menu-item-size')
@Roles("staff")
export class MenuItemSizeController extends ControllerBase<MenuItemSize>{
  constructor(
    private readonly sizeService: MenuItemSizeService
  ) { super(sizeService); }
}