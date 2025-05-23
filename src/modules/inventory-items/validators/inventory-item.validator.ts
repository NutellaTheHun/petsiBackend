import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { InventoryItem } from "../entities/inventory-item.entity";
import { CreateInventoryItemDto } from "../dto/inventory-item/create-inventory-item.dto";
import { UpdateInventoryItemDto } from "../dto/inventory-item/update-inventory-item.dto";
import { InventoryItemSizeService } from "../services/inventory-item-size.service";
import { ValidationError } from "../../../util/exceptions/validationError";

@Injectable()
export class InventoryItemValidator extends ValidatorBase<InventoryItem> {
    constructor(
        @InjectRepository(InventoryItem)
        private readonly repo: Repository<InventoryItem>,

        @Inject(forwardRef(() => InventoryItemSizeService))
        private readonly sizeService: InventoryItemSizeService,
    ){ super(repo); }

    public async validateCreate(dto: CreateInventoryItemDto): Promise<ValidationError[]> {
        // no existing name
        const exists = await this.repo.findOne({ where: { itemName: dto.itemName }});
        if(await this.helper.exists(this.repo, 'itemName', dto.itemName)) { 
            this.addError({
                error: 'Inventory item already exists',
                status: 'EXIST',
                contextEntity: 'CreateInventoryItemDto',
                sourceEntity: 'InventoryItem',
                value: dto.itemName
            } as ValidationError);
        }

        // no duplicate item sizing
        if(dto.itemSizeDtos && dto.itemSizeDtos.length > 0){
            const dupliateSizing = this.helper.findDuplicates(
                dto.itemSizeDtos, 
                (size) => `${size.inventoryPackageId}:${size.measureUnitId}`
            );
            if(dupliateSizing){
                for(const duplicate of dupliateSizing){
                    this.addError({
                        error: 'duplicate inventory item sizes',
                        status: 'DUPLICATE',
                        contextEntity: 'CreateInventoryItemDto',
                        sourceEntity: 'CreateChildInventoryItemSizeDto',
                        value: {packageId: duplicate.inventoryPackageId, measureId: duplicate.measureUnitId},
                    } as ValidationError);
                }
            }
        }
        

        return this.errors;
    }
    
    public async validateUpdate(id: number, dto: UpdateInventoryItemDto): Promise<ValidationError[]> {

        // no existing name
        if(dto.itemName){
            if(await this.helper.exists(this.repo, 'itemName', dto.itemName)) { 
                 this.addError({
                    error: 'Inventory item already exists',
                    status: 'EXIST',
                    contextEntity: 'UpdateInventoryItemDto',
                    contextId: id,
                    sourceEntity: 'InventoryItem',
                    value: dto.itemName
                } as ValidationError); 
            }
        }

        // no duplicate item sizing, or duplicate update ids
        if(dto.itemSizeDtos && dto.itemSizeDtos.length > 0){

            const resolvedUpdateDtos: {id: number}[] = [];
            const resolvedSizeDtos: {inventoryPackageId: number; measureUnitId: number}[] = [];
            for(const d of dto.itemSizeDtos){
                if(d.mode === 'create'){
                    // resolve duplicate sizing
                    resolvedSizeDtos.push({ inventoryPackageId: d.inventoryPackageId, measureUnitId: d.measureUnitId});
                }
                if(d.mode === 'update'){
                    // resolve duplicate ids
                    resolvedUpdateDtos.push({ id: d.id});

                    // resolve duplicate sizing
                    if(d.inventoryPackageId || d.measureUnitId){
                        const currentSize = await this.sizeService.findOne(d.id, ['measureUnit', 'packageType']);
                        if(!currentSize){ throw new Error(); }

                        const pkgId = d.inventoryPackageId ?? currentSize.packageType.id;
                        const measureId = d.measureUnitId ?? currentSize.measureUnit.id;

                        resolvedSizeDtos.push({ inventoryPackageId: pkgId, measureUnitId: measureId});
                    }
                }
            }

            // Validate duplicate update ids
            const dupliateIds = this.helper.findDuplicates(
                resolvedUpdateDtos,
                (id) => `${id.id}`
            );
            if(dupliateIds){
                for(const duplicate of dupliateIds){
                    this.addError({
                        error: 'duplicate inventory item sizes',
                        status: 'DUPLICATE',
                        contextEntity: 'UpdateInventoryItemDto',
                        contextId: id,
                        sourceEntity: 'UpdateChildInventoryItemSizeDto',
                        sourceId: duplicate.id
                    } as ValidationError);
                }
            }

            // Validate duplicate sizing
            const dupliateSizing = this.helper.findDuplicates(
                resolvedSizeDtos,
                (size) => `${size.inventoryPackageId}:${size.measureUnitId}`
            );
            if(dupliateSizing){
                for(const duplicate of dupliateSizing){
                    this.addError({
                        error: 'duplicate inventory item sizes',
                        status: 'DUPLICATE',
                        contextEntity: 'UpdateInventoryItemDto',
                        contextId: id,
                        sourceEntity: 'CreateChildInventoryItemSizeDto | UpdateChildInventoryItemSizeDto',
                        value: {packageId: duplicate.inventoryPackageId, measureId: duplicate.measureUnitId},
                    } as ValidationError);
                }
            }
        }
        return this.errors;
    }
}