import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { InventoryArea } from "../entities/inventory-area.entity";

@Injectable()
export class InventoryAreaValidator extends ValidatorBase<InventoryArea> {
    constructor(
        @InjectRepository(InventoryArea)
        private readonly areaRepo: Repository<InventoryArea>,
    ){ super(areaRepo); }

    public async validateCreate(dto: any): Promise<string | null> {
        const exists = await this.areaRepo.findOne({ where: { name: dto.name }});
        if(exists) { 
            return 'Inventory area already exists'; 
        }
        return null;
    }
    public async validateUpdate(dto: any): Promise<string | null> {
        return null;
    }
}