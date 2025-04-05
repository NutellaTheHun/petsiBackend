import { PartialType } from "@nestjs/mapped-types";
import { CreateInventoryAreaItemDto } from "./create-inventory-area-item.dto";

export class UpdateInventoryAreaItemDto extends PartialType(CreateInventoryAreaItemDto){}