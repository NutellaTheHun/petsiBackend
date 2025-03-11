import { Controller } from "@nestjs/common";
import { InventoryItemVendor } from "../entities/inventory-item-vendor.entity";
import { InventoryItemVendorService } from "../services/inventory-item-vendor.service";
import { ControllerBase } from "../../../base/controller-base";

@Controller('inventory-item-vendor')
export class InventoryItemVendorController extends ControllerBase<InventoryItemVendor> {
    constructor(
        private readonly vendorService: InventoryItemVendorService
    ){ super(vendorService); }
}