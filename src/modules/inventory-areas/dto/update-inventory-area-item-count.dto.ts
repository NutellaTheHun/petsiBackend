import { PartialType } from "@nestjs/mapped-types";
import { CreateInventoryAreaItemCountDto } from "./create-inventory-area-item-count.dto";

export class UpdateInventoryAreaItemCountDto extends PartialType(CreateInventoryAreaItemCountDto){}