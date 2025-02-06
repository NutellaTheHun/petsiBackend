import { PartialType } from "@nestjs/mapped-types";
import { CreateInventoryItemCategoryDto } from "./create-inventory-item-category.dto";

export class UpdateInventoryItemCategoryDto extends PartialType(CreateInventoryItemCategoryDto){}