import { PartialType } from "@nestjs/mapped-types";
import { CreateMenuItemCategoryDto } from "./create-menu-item-category.dto";

export class UpdateMenuItemCategoryDto extends PartialType(CreateMenuItemCategoryDto) {}