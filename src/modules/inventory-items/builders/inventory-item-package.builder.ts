import { Injectable } from "@nestjs/common";
import { CreateInventoryItemPackageDto } from "../dto/create-inventory-item-package.dto";
import { InventoryItemPackage } from "../entities/inventory-item-package.entity";
import { UpdateInventoryItemPackageDto } from "../dto/update-inventory-item-package.dto";
import { BuilderBase } from "../../../base/builder-base";
import { InventoryItemPackageValidator } from "../validators/inventory-item-package.validator";

@Injectable()
export class InventoryItemPackageBuilder extends BuilderBase<InventoryItemPackage> {
    constructor(
        validator: InventoryItemPackageValidator,
    ){ super(InventoryItemPackage, validator); }

    protected async createEntity(dto: CreateInventoryItemPackageDto): Promise<void> {
        if(dto.name){
            this.name(dto.name);
        }
    }
    protected async updateEntity(dto: UpdateInventoryItemPackageDto): Promise<void> {
        if(dto.name){
            this.name(dto.name);
        }
    }

    public name(name: string): this {
        return this.setProp('name', name);
    }
}