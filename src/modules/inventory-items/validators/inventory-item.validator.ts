import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { InventoryItem } from "../entities/inventory-item.entity";
import { CreateInventoryItemDto } from "../dto/inventory-item/create-inventory-item.dto";
import { UpdateInventoryItemDto } from "../dto/inventory-item/update-inventory-item.dto";

@Injectable()
export class InventoryItemValidator extends ValidatorBase<InventoryItem> {
    constructor(
        @InjectRepository(InventoryItem)
        private readonly repo: Repository<InventoryItem>,
    ){ super(repo); }

    public async validateCreate(dto: CreateInventoryItemDto): Promise<string | null> {
        const exists = await this.repo.findOne({ where: { itemName: dto.itemName }});
        if(exists) { 
            return `Inventory item with name ${dto.itemName} already exists`; 
        }
        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateInventoryItemDto): Promise<string | null> {
        return null;
    }
}