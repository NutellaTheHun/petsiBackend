import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { InventoryItemVendor } from "../entities/inventory-item-vendor.entity";

@Injectable()
export class InventoryItemVendorValidator extends ValidatorBase<InventoryItemVendor> {
    constructor(
        @InjectRepository(InventoryItemVendor)
        private readonly repo: Repository<InventoryItemVendor>,
    ){ super(repo); }

    public async validateCreate(dto: any): Promise<string | null> {
        return null;
    }
    public async validateUpdate(dto: any): Promise<string | null> {
        return null;
    }
}