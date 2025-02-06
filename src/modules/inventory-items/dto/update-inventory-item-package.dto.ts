import { PartialType } from "@nestjs/mapped-types";
import { CreateInventoryItemPackageDto } from "./create-inventory-item-package.dto";

export class UpdateInventoryItemPackageDto extends PartialType(CreateInventoryItemPackageDto){}