import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { InventoryItemPackage } from "../entities/inventory-item-package.entity";

@Injectable()
export class InventoryItemPackageValidator extends ValidatorBase<InventoryItemPackage> {
    constructor(
        @InjectRepository(InventoryItemPackage)
        private readonly repo: Repository<InventoryItemPackage>,
    ){ super(repo); }

    public async validateCreate(dto: any): Promise<string | null> {
        return null;
    }
    public async validateUpdate(dto: any): Promise<string | null> {
        return null;
    }
}