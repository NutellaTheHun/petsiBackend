import { Injectable } from "@nestjs/common";
import { CreateInventoryItemPackageDto } from "../dto/create-inventory-item-package.dto";
import { InventoryItemPackage } from "../entities/inventory-item-package.entity";
import { UpdateInventoryItemPackageDto } from "../dto/update-inventory-item-package.dto";

@Injectable()
export class InventoryItemPackageBuilder {
    private itemPackage: InventoryItemPackage;
    
    constructor(){  this.reset(); }

    public reset(): this {
        this.itemPackage = new InventoryItemPackage();
        return this;
    }

    public name(name: string): this {
        this.itemPackage.name = name;
        return this;
    }

    public getPackage(): InventoryItemPackage{
        const result = this.itemPackage;
        this.reset();
        return result;
    }

    public buildCreateDto(dto: CreateInventoryItemPackageDto): InventoryItemPackage {
        this.reset();

        if(dto.name){
            this.name(dto.name);
        }

        return this.getPackage();
    }

    public updatePackage(itemPackage: InventoryItemPackage): this {
        this.itemPackage = itemPackage;
        return this;
        
    }

    public buildUpdateDto(itemPackage: InventoryItemPackage,dto: UpdateInventoryItemPackageDto): InventoryItemPackage {
        this.reset();

        this.updatePackage(itemPackage);
        
        if(dto.name){
            this.name(dto.name);
        }

        return this.getPackage();
    }
}