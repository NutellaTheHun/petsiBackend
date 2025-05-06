import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { InventoryItemSize } from "../entities/inventory-item-size.entity";

@Injectable()
export class InventoryItemSizeValidator extends ValidatorBase<InventoryItemSize> {
    constructor(
        @InjectRepository(InventoryItemSize)
        private readonly repo: Repository<InventoryItemSize>,
    ){ super(repo); }

    public async validateCreate(dto: any): Promise<string | null> {
        return null;
    }
    public async validateUpdate(dto: any): Promise<string | null> {
        return null;
    }
}