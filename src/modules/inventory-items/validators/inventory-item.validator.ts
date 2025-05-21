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
            const resolvedUpdateDtos: {id: number}[] = [];
            const resolvedCreateDtos: {inventoryPackageId: number; measureUnitId: number}[] = [];
            for(const d of dto.itemSizeDtos){
                if(d.mode === 'update'){
                    resolvedUpdateDtos.push({ id: d.id});
                }
                if(d.mode === 'create'){
                    resolvedCreateDtos.push({ inventoryPackageId: d.inventoryPackageId, measureUnitId: d.measureUnitId});
                }
            }
            const dupliateIds = this.helper.hasDuplicatesByComposite(
                resolvedUpdateDtos,
                (id) => `${id.id}`
            );
            if(dupliateIds){ // only applies to update
                return 'inventory item has duplicate update dtos for the same item size id';
            }
            const dupliateSizing = this.helper.hasDuplicatesByComposite(
                resolvedCreateDtos,
                (size) => `${size.inventoryPackageId}:${size.measureUnitId}`
            );
            if(dupliateSizing){ // only applies to create
                return 'inventory item has duplicate create sizing (package/measurement combination)';
            }
        }
        return null;
    }
}