import { PartialType } from "@nestjs/mapped-types";
import { CreateInventoryAreaDto } from "./create-inventory-area.dto";

export class UpdateInventoryAreaDto extends PartialType(CreateInventoryAreaDto){}