import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { InventoryAreaItem } from "../entities/inventory-area-item.entity";

@Injectable()
export class InventoryAreaItemValidator extends ValidatorBase<InventoryAreaItem> {
    constructor(
        @InjectRepository(InventoryAreaItem)
        private readonly repo: Repository<InventoryAreaItem>,
    ){ super(repo); }

    public async validateCreate(dto: any): Promise<string | null> {
        return null;
    }
    public async validateUpdate(dto: any): Promise<string | null> {
        return null;
    }
}