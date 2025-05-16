import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { InventoryAreaCount } from "../entities/inventory-area-count.entity";
import { CreateInventoryAreaCountDto } from "../dto/create-inventory-area-count.dto";
import { UpdateInventoryAreaCountDto } from "../dto/update-inventory-area-count.dto";

@Injectable()
export class InventoryAreaCountValidator extends ValidatorBase<InventoryAreaCount> {
    constructor(
        @InjectRepository(InventoryAreaCount)
        private readonly repo: Repository<InventoryAreaCount>,
    ){ super(repo); }

    public async validateCreate(dto: CreateInventoryAreaCountDto): Promise<string | null> {
        return null;
    }
    public async validateUpdate(dto: UpdateInventoryAreaCountDto): Promise<string | null> {
        return null;
    }
}