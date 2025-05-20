import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { InventoryArea } from "../entities/inventory-area.entity";
import { CreateInventoryAreaDto } from "../dto/inventory-area/create-inventory-area.dto";
import { UpdateInventoryAreaDto } from "../dto/inventory-area/update-inventory-area.dto";

@Injectable()
export class InventoryAreaValidator extends ValidatorBase<InventoryArea> {
    constructor(
        @InjectRepository(InventoryArea)
        private readonly areaRepo: Repository<InventoryArea>,
    ){ super(areaRepo); }

    public async validateCreate(dto: CreateInventoryAreaDto): Promise<string | null> {
        // Already exists check
        const exists = await this.areaRepo.findOne({ where: { areaName: dto.areaName }});
        if(exists) { 
            return `Inventory with name ${dto.areaName} already exists`; 
        }
        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateInventoryAreaDto): Promise<string | null> {
        // Already exists check
        const exists = await this.areaRepo.findOne({ where: { areaName: dto.areaName }});
        if(exists) { 
            return `Inventory with name ${dto.areaName} already exists`; 
        }

        return null;
    }
}