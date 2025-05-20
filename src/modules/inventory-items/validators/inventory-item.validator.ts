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

        if(dto.itemSizeDtos){
            const dupliateSizing = this.helper.hasDuplicatesByComposite(
                dto.itemSizeDtos,
                (size) => `${size.inventoryPackageId}:${size.measureUnitId}`
            );
            if(dupliateSizing){
                return 'inventory item has duplicate sizing (package/measurement combination)';
            }
        }
        
        // validate no duplicate item sizing

        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateInventoryItemDto): Promise<string | null> {
        if(dto.itemName){
            const exists = await this.repo.findOne({ where: { itemName: dto.itemName }});
            if(exists) { 
                return `Inventory item with name ${dto.itemName} already exists`; 
            }
        }

        if(dto.itemSizeDtos){
            const dupliateSizing = this.helper.hasDuplicatesByComposite(
                dto.itemSizeDtos,
                (size) => `${size.inventoryPackageId}:${size.measureUnitId}`
            );
            if(dupliateSizing){
                return 'inventory item has duplicate sizing (package/measurement combination)';
            }
        }
        return null;
    }
}