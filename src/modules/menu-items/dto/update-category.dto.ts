import { PartialType } from "@nestjs/mapped-types";
import { CreateMenuCategoryDto } from "./create-menu-category.dto";

export class UpdateCategoryDto extends PartialType(CreateMenuCategoryDto) {}