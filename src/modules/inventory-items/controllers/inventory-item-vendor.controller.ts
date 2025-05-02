import { Controller, Inject } from "@nestjs/common";
import { InventoryItemVendor } from "../entities/inventory-item-vendor.entity";
import { InventoryItemVendorService } from "../services/inventory-item-vendor.service";
import { ControllerBase } from "../../../base/controller-base";
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from "@nestjs/cache-manager";

@Controller('inventory-item-vendor')
export class InventoryItemVendorController extends ControllerBase<InventoryItemVendor> {
    constructor(
        vendorService: InventoryItemVendorService,
        @Inject(CACHE_MANAGER) cacheManager: Cache
    ){ super(vendorService, cacheManager); }
}