import { PartialType } from "@nestjs/mapped-types";
import { CreateMenuItemSizeDto } from "./create-menu-item-size.dto";

export class UpdateMenuItemSizeDto extends PartialType(CreateMenuItemSizeDto) { }