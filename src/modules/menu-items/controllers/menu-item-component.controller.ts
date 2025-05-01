import { Controller } from "@nestjs/common";
import { ControllerBase } from "../../../base/controller-base";
import { Roles } from "../../../util/decorators/PublicRole";
import { MenuItemComponent } from "../entities/menu-item-component.entity";
import { MenuItemComponentService } from "../services/menu-item-component.service";

@Controller('menu-item-component')
@Roles("staff")
export class MenuItemComponentController extends ControllerBase<MenuItemComponent>{
  constructor(
    private readonly componentService: MenuItemComponentService,
  ) { super(componentService); }
}