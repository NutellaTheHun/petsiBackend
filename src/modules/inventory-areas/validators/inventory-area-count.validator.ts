import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { InventoryAreaCount } from "../entities/inventory-area-count.entity";

@Injectable()
export class InventoryAreaCountValidator extends ValidatorBase<InventoryAreaCount> {
    constructor(
        @InjectRepository(InventoryAreaCount)
        private readonly repo: Repository<InventoryAreaCount>,
    ){ super(repo); }

    public async validateCreate(dto: any): Promise<string | null> {
        return null;
    }
    public async validateUpdate(dto: any): Promise<string | null> {
        return null;
    }
}