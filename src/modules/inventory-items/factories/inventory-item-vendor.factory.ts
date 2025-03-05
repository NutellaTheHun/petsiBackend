import { Injectable } from "@nestjs/common";
import { EntityFactory } from "../../../base/entity-factory";
import { InventoryItemVendor } from "../entities/inventory-item-vendor.entity";
import { CreateDefaultInventoryItemVendorDtoValues, CreateInventoryItemVendorDto } from "../dto/create-inventory-item-vendor.dto";
import { UpdateInventoryItemVendorDto } from "../dto/update-inventory-item-vendor.dto";

@Injectable()
export class InventoryItemVendorFactory extends EntityFactory<InventoryItemVendor, CreateInventoryItemVendorDto, UpdateInventoryItemVendorDto>{

    constructor() {
        super(InventoryItemVendor, CreateInventoryItemVendorDto, UpdateInventoryItemVendorDto, CreateDefaultInventoryItemVendorDtoValues());
    }

    getDefaultRoles(): InventoryItemVendor[] {
        return [

        ];
    }

    getTestingRoles(): InventoryItemVendor[]{
        return [
            this.createEntityInstance({ name: "vendorA" }),
            this.createEntityInstance({ name: "vendorB" }),
            this.createEntityInstance({ name: "vendorC" }),
        ];
    }  
}