import { Injectable } from "@nestjs/common";
import { EntityFactory } from "../../../base/entity-factory";
import { InventoryItemPackage } from "../entities/inventory-item-package.entity";
import { CreateDefaultInventoryItemPackageDtoValues, CreateInventoryItemPackageDto } from "../dto/create-inventory-item-package.dto";
import { UpdateInventoryItemPackageDto } from "../dto/update-inventory-item-package.dto";

@Injectable()
export class InventoryItemPackageFactory extends EntityFactory<InventoryItemPackage, CreateInventoryItemPackageDto, UpdateInventoryItemPackageDto>{

    constructor() {
        super( InventoryItemPackage, CreateInventoryItemPackageDto, UpdateInventoryItemPackageDto, CreateDefaultInventoryItemPackageDtoValues());
    }

    getDefaultRoles(): InventoryItemPackage[] {
        return [
            this.createEntityInstance({ name: "bag" }),
            this.createEntityInstance({ name: "package" }),
            this.createEntityInstance({ name: "box" }),
            this.createEntityInstance({ name: "other" }),
            this.createEntityInstance({ name: "container" }),
            this.createEntityInstance({ name: "can" })
        ];
    }

    getTestingRoles(): InventoryItemPackage[]{
        return this.getDefaultRoles();
    }  
}