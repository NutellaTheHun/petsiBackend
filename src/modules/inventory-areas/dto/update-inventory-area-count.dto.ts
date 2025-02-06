import { PartialType } from "@nestjs/mapped-types";
import { CreateInventoryAreaCountDto } from "./create-inventory-area-count.dto";

export class UpdateInventoryAreaCountDto extends PartialType(CreateInventoryAreaCountDto){}