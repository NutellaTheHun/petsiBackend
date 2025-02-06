import { PartialType } from "@nestjs/mapped-types";
import { CreateInventoryItemSizeDto } from "./create-inventory-item-size.dto";

export class UpdateStorageItemSizeDto extends PartialType(CreateInventoryItemSizeDto){}