import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { CreateInventoryItemVendorDto } from "../dto/inventory-item-vendor/create-inventory-item-vendor.dto";
import { UpdateInventoryItemVendorDto } from "../dto/inventory-item-vendor/update-inventory-item-vendor.dto";
import { InventoryItemVendor } from "../entities/inventory-item-vendor.entity";

@Injectable()
export class InventoryItemVendorValidator extends ValidatorBase<InventoryItemVendor> {
    constructor(
        @InjectRepository(InventoryItemVendor)
        private readonly repo: Repository<InventoryItemVendor>,
    ){ super(repo); }

    public async validateCreate(dto: CreateInventoryItemVendorDto): Promise<string | null> {
        const exists = await this.repo.findOne({ where: { vendorName: dto.vendorName }});
        if(exists) { 
            return `Inventory item vendor with name ${dto.vendorName} already exists`; 
        }
        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateInventoryItemVendorDto): Promise<string | null> {
        if(dto.vendorName){
            const exists = await this.repo.findOne({ where: { vendorName: dto.vendorName }});
            if(exists) { 
                return `Inventory item vendor with name ${dto.vendorName} already exists`; 
            }
        }
        
        return null;
    }
}