import { PartialType } from "@nestjs/mapped-types";
import { CreateInventoryItemVendorDto } from "./create-inventory-item-vendor.dto";

export class UpdateInventoryItemVendorDto extends PartialType(CreateInventoryItemVendorDto){}