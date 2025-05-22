import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { InventoryItem } from "../entities/inventory-item.entity";
import { CreateInventoryItemDto } from "../dto/inventory-item/create-inventory-item.dto";
import { UpdateInventoryItemDto } from "../dto/inventory-item/update-inventory-item.dto";
import { InventoryItemSizeService } from "../services/inventory-item-size.service";

@Injectable()
export class InventoryItemValidator extends ValidatorBase<InventoryItem> {
    constructor(
        @InjectRepository(InventoryItem)
        private readonly repo: Repository<InventoryItem>,
        private readonly sizeService: InventoryItemSizeService,
    ){ super(repo); }

    public async validateCreate(dto: CreateInventoryItemDto): Promise<string | null> {
        // no existing name
        const exists = await this.repo.findOne({ where: { itemName: dto.itemName }});
        if(exists) { 
            return `Inventory item with name ${dto.itemName} already exists`; 
        }

        // no duplicate item sizing
        if(dto.itemSizeDtos && dto.itemSizeDtos.length > 0){
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
    
    public async validateUpdate(id: number, dto: UpdateInventoryItemDto): Promise<string | null> {
        // no existing name
        if(dto.itemName){
            const exists = await this.repo.findOne({ where: { itemName: dto.itemName }});
            if(exists) { 
                return `Inventory item with name ${dto.itemName} already exists`; 
            }
        }

        // no duplicate item sizing, or duplicate update ids
        if(dto.itemSizeDtos && dto.itemSizeDtos.length > 0){
            const resolvedUpdateDtos: {id: number}[] = [];
            const resolvedSizeDtos: {inventoryPackageId: number; measureUnitId: number}[] = [];
            for(const d of dto.itemSizeDtos){
                if(d.mode === 'update'){
                    // resolve duplicate ids
                    resolvedUpdateDtos.push({ id: d.id});

                    //resolve duplicate sizing for updates
                    if(d.inventoryPackageId || d.measureUnitId){
                        const currentSize = await this.sizeService.findOne(d.id, ['measureUnit', 'packageType']);
                        if(!currentSize){ throw new Error(); }

                        const pkgId = d.inventoryPackageId ?? currentSize.packageType.id;
                        const measureId = d.measureUnitId ?? currentSize.measureUnit.id;

                        resolvedSizeDtos.push({ inventoryPackageId: pkgId, measureUnitId: measureId});
                    }
                    
                }
                if(d.mode === 'create'){
                    //resolve duplicate sizing for creates
                    resolvedSizeDtos.push({ inventoryPackageId: d.inventoryPackageId, measureUnitId: d.measureUnitId});
                }
            }

            // Validate duplicate update ids
            const dupliateIds = this.helper.hasDuplicatesByComposite(
                resolvedUpdateDtos,
                (id) => `${id.id}`
            );
            if(dupliateIds){ // only applies to update
                return 'inventory item has duplicate update dtos for the same item size id';
            }

            // Validate duplicate sizing
            const dupliateSizing = this.helper.hasDuplicatesByComposite(
                resolvedSizeDtos,
                (size) => `${size.inventoryPackageId}:${size.measureUnitId}`
            );
            if(dupliateSizing){
                return 'inventory item has duplicate create sizing (package/measurement combination)';
            }
        }
        return null;
    }
}