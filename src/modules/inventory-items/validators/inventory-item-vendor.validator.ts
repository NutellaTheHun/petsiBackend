import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { CreateInventoryItemVendorDto } from "../dto/inventory-item-vendor/create-inventory-item-vendor.dto";
import { UpdateInventoryItemVendorDto } from "../dto/inventory-item-vendor/update-inventory-item-vendor.dto";
import { InventoryItemVendor } from "../entities/inventory-item-vendor.entity";
import { ValidationError } from "../../../util/exceptions/validationError";

@Injectable()
export class InventoryItemVendorValidator extends ValidatorBase<InventoryItemVendor> {
    constructor(
        @InjectRepository(InventoryItemVendor)
        private readonly repo: Repository<InventoryItemVendor>,
    ){ super(repo); }

    public async validateCreate(dto: CreateInventoryItemVendorDto): Promise<ValidationError[]> {
        if(await this.helper.exists(this.repo, 'vendorName', dto.vendorName)) { 
            this.addError({
                error: 'Inventory vendor already exists',
                status: 'EXIST',
                contextEntity: 'CreateInventoryItemVendorDto',
                sourceEntity: 'InventoryItemVendor',
                value: dto.vendorName
            } as ValidationError); 
        }
        return this.errors;
    }
    
    public async validateUpdate(id: number, dto: UpdateInventoryItemVendorDto): Promise<ValidationError[]> {
        if(dto.vendorName){
            if(await this.helper.exists(this.repo, 'vendorName', dto.vendorName)) {
                this.addError({
                    error: 'Inventory vendor already exists',
                    status: 'EXIST',
                    contextEntity: 'UpdateInventoryItemVendorDto',
                    contextId: id,
                    sourceEntity: 'InventoryItemVendor',
                    value: dto.vendorName
                } as ValidationError); 
            }
        }
        
        return this.errors;
    }
}