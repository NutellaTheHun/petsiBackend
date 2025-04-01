import { Controller } from "@nestjs/common";
import { ControllerBase } from "../../../base/controller-base";
import { Roles } from "../../../util/decorators/PublicRole";
import { MenuItemCategory } from "../entities/menu-item-category.entity";
import { MenuItemCategoryService } from "../services/menu-item-category.service";

Controller('menu-category')
@Roles("staff")
export class MenuItemCategoryController extends ControllerBase<MenuItemCategory>{
  constructor(
    private readonly categoryService: MenuItemCategoryService
  ) { super(categoryService); }
}