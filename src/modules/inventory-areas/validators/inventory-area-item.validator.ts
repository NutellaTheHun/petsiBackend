import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { InventoryAreaItem } from "../entities/inventory-area-item.entity";
import { CreateInventoryAreaItemDto } from "../dto/create-inventory-area-item.dto";

@Injectable()
export class InventoryAreaItemValidator extends ValidatorBase<InventoryAreaItem> {
    constructor(
        @InjectRepository(InventoryAreaItem)
        private readonly repo: Repository<InventoryAreaItem>,
    ){ super(repo); }

    public async validateCreate(dto: CreateInventoryAreaItemDto): Promise<string | null> {
        if(!dto.itemSizeId && !dto.itemSizeDto){
            return 'inventory area item create dto requires InventoryItemSize id or CreateInventoryItemSizeDto';
        }
        if(dto.itemSizeId && dto.itemSizeDto){
            return 'inventory area item create dto cannot have both an InventoryItemSize id and CreateInventoryItemSizeDto';
        }

        return null;
    }
    public async validateUpdate(dto: any): Promise<string | null> {
        if(dto.itemSizeId && dto.itemSizeDto){
            return 'inventory area item update dto cannot have both an InventoryItemSize id and CreateInventoryItemSizeDto';
        }
        if(dto.inventoryItemId && !dto.itemSizeId && !dto.itemSizeDto){
            return 'updating inventory item must be accompanied by updated sizing';
        }
        return null;
    }
}