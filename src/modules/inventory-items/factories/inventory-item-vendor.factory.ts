import { Injectable } from "@nestjs/common";
import { EntityFactory } from "../../../base/entity-factory";
import { InventoryItemVendor } from "../entities/inventory-item-vendor.entity";
import { CreateDefaultInventoryItemVendorDtoValues, CreateInventoryItemVendorDto } from "../dto/create-inventory-item-vendor.dto";
import { UpdateInventoryItemVendorDto } from "../dto/update-inventory-item-vendor.dto";
import { VENDOR_A, VENDOR_B, VENDOR_C } from "../utils/constants";

@Injectable()
export class InventoryItemVendorFactory extends EntityFactory<InventoryItemVendor, CreateInventoryItemVendorDto, UpdateInventoryItemVendorDto>{

    constructor() {
        super(InventoryItemVendor, CreateInventoryItemVendorDto, UpdateInventoryItemVendorDto, CreateDefaultInventoryItemVendorDtoValues());
    }

    getDefaultVendors(): InventoryItemVendor[] {
        return [

        ];
    }

    getTestingVendors(): InventoryItemVendor[]{
        return [
            this.createEntityInstance({ name: VENDOR_A }),
            this.createEntityInstance({ name: VENDOR_B }),
            this.createEntityInstance({ name: VENDOR_C }),
        ];
    }  
}