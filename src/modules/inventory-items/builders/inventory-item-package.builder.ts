import { Injectable } from "@nestjs/common";
import { CreateInventoryItemPackageDto } from "../dto/create-inventory-item-package.dto";
import { InventoryItemPackage } from "../entities/inventory-item-package.entity";
import { UpdateInventoryItemPackageDto } from "../dto/update-inventory-item-package.dto";
import { BuilderBase } from "../../../base/builder-base";

@Injectable()
export class InventoryItemPackageBuilder extends BuilderBase<InventoryItemPackage> {
    constructor(){  super(InventoryItemPackage); }

    public name(name: string): this {
        return this.setProp('name', name);
    }

    public async buildCreateDto(dto: CreateInventoryItemPackageDto): Promise<InventoryItemPackage> {
        this.reset();

        if(dto.name){
            this.name(dto.name);
        }

        return await this.build();
    }

    public async buildUpdateDto(itemPackage: InventoryItemPackage,dto: UpdateInventoryItemPackageDto): Promise<InventoryItemPackage> {
        this.reset();
        this.updateEntity(itemPackage);
        
        if(dto.name){
            this.name(dto.name);
        }

        return await this.build();
    }
}