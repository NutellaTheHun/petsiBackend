import { Injectable } from "@nestjs/common";
import { CreateInventoryItemPackageDto } from "../dto/create-inventory-item-package.dto";
import { InventoryItemPackage } from "../entities/inventory-item-package.entity";
import { UpdateInventoryItemPackageDto } from "../dto/update-inventory-item-package.dto";

@Injectable()
export class InventoryItemPackageBuilder {
    private itemPackage: InventoryItemPackage;
    private taskQueue: (() => Promise<void>)[];

    constructor(){  this.reset(); }

    public reset(): this {
        this.itemPackage = new InventoryItemPackage();
        this.taskQueue = [];
        return this;
    }

    public name(name: string): this {
        this.itemPackage.name = name;
        return this;
    }

    public async build(): Promise<InventoryItemPackage>{
        for(const task of this.taskQueue){
            await task();
        }
        
        const result = this.itemPackage;
        this.reset();
        return result;
    }

    public async buildCreateDto(dto: CreateInventoryItemPackageDto): Promise<InventoryItemPackage> {
        this.reset();

        if(dto.name){
            this.name(dto.name);
        }

        return await this.build();
    }

    public updatePackage(itemPackage: InventoryItemPackage): this {
        this.itemPackage = itemPackage;
        return this;
    }

    public async buildUpdateDto(itemPackage: InventoryItemPackage,dto: UpdateInventoryItemPackageDto): Promise<InventoryItemPackage> {
        this.reset();

        this.updatePackage(itemPackage);
        
        if(dto.name){
            this.name(dto.name);
        }

        return await this.build();
    }
}