import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { UnitOfMeasureService } from "../../unit-of-measure/services/unit-of-measure.service";
import { CreateInventoryItemSizeDto } from "../dto/create-inventory-item-size.dto";
import { UpdateInventoryItemSizeDto } from "../dto/update-inventory-item-size.dto";
import { InventoryItemSize } from "../entities/inventory-item-size.entity";
import { InventoryItemPackageService } from "../services/inventory-item-package.service";
import { InventoryItemService } from "../services/inventory-item.service";
import { InventoryItem } from "../entities/inventory-item.entity";
import { InventoryItemSizeService } from "../services/inventory-item-size.service";
import { IBuildChildDto } from "../../../base/interfaces/IBuildChildEntity.interface";

@Injectable()
export class InventoryItemSizeBuilder extends BuilderBase<InventoryItemSize> implements IBuildChildDto<InventoryItem, InventoryItemSize>{
    constructor(
        @Inject(forwardRef(() => InventoryItemService))
        private readonly itemService: InventoryItemService,

        @Inject(forwardRef(() => InventoryItemSizeService))
        private readonly sizeService: InventoryItemSizeService,

        private readonly packageService: InventoryItemPackageService,
        private readonly unitService: UnitOfMeasureService,
    ){ super(InventoryItemSize); }

    public unitOfMeasureById(id: number): this {
        return this.setPropById(this.unitService.findOne.bind(this.unitService), 'measureUnit', id);
    }

    public unitOfMeasureByName(name: string): this {
        return this.setPropByName(this.unitService.findOneByName.bind(this.unitService), 'measureUnit', name);
    }

    public packageById(id: number): this {
        return this.setPropById(this.packageService.findOne.bind(this.packageService), 'packageType', id);
    }

    public packageByName(name: string): this {
        return this.setPropByName(this.packageService.findOneByName.bind(this.packageService), 'packageType', name);
    }

    public InventoryItemById(id: number): this {
        return this.setPropById(this.itemService.findOne.bind(this.itemService), 'item', id);
    }

    public InventoryItemByName(name: string): this {
        return this.setPropByName(this.itemService.findOneByName.bind(this.itemService), 'item', name);
    }

    public async buildCreateDto(dto: CreateInventoryItemSizeDto): Promise<InventoryItemSize>{
        this.reset();

        if(dto.inventoryItemId){
            this.InventoryItemById(dto.inventoryItemId);
        }

        if(dto.inventoryPackageTypeId){
            this.packageById(dto.inventoryPackageTypeId);
        }
        
        if(dto.unitOfMeasureId){
            this.unitOfMeasureById(dto.unitOfMeasureId);
        }

        return this.build();
    }

    public async buildChildCreateDto(_: InventoryItem, dto: CreateInventoryItemSizeDto): Promise<InventoryItemSize>{
        this.reset();
        /*
         When being called in the sequence of:
         InventoryAreaCountBuilder -> InventoryAreaItem, the passed parent is not an inventory item, but the inventory area item, 
         so effectively is a non-usuable argument, and is not neccessary, as all info is contained within the dto anyway.

         this is the single edge case that the builder base method setPropAfterBuild() doesnt work perfectly for this parent/child 
         assignment relationship, as setPropAfterBuild expected the parent entity, which is not the case in this instance.
        */
        //this.entity.item = parentItem;

        if(dto.inventoryItemId){
            this.InventoryItemById(dto.inventoryItemId);
        }

        if(dto.inventoryPackageTypeId){
            this.packageById(dto.inventoryPackageTypeId);
        }
        
        if(dto.unitOfMeasureId){
            this.unitOfMeasureById(dto.unitOfMeasureId);
        }

        return this.build();
    }

    public async buildUpdateDto(toUpdate: InventoryItemSize, dto: UpdateInventoryItemSizeDto): Promise<InventoryItemSize> {
        this.reset();
        this.updateEntity(toUpdate);

        if(dto.inventoryPackageTypeId){
            this.packageById(dto.inventoryPackageTypeId);
        }
        if(dto.unitOfMeasureId){
            this.unitOfMeasureById(dto.unitOfMeasureId);
        }

        return this.build();
    }
    
    /**
     * Builds InventoryItemSize entities from either Create or UpdateDTOs, input dtos can be an array mixed with both create and update.
     */
    public async buildManyDto(parentItem: InventoryItem, dtos: (CreateInventoryItemSizeDto | UpdateInventoryItemSizeDto)[]): Promise<InventoryItemSize[]> {
        const results: InventoryItemSize[] = [];
        for(const dto of dtos){
            if(dto.mode === 'create'){
                results.push( await this.buildChildCreateDto(parentItem, dto))
            } else {
                const size = await this.sizeService.findOne(dto.id, ['item', 'measureUnit', 'packageType']);
                if(!size){ throw new Error("item size not found"); }
                results.push(await this.buildUpdateDto(size, dto));
            }
        }
        return results;
    }

    public async buildDto(parentItem: InventoryItem, dto: (CreateInventoryItemSizeDto | UpdateInventoryItemSizeDto)): Promise<InventoryItemSize> {
        if(dto.mode === 'create'){
            return await this.buildChildCreateDto(parentItem, dto);
        }
        
        const size = await this.sizeService.findOne(dto.id, ['item', 'measureUnit', 'packageType']);
        if(!size){ throw new Error("item size not found"); }
        return await this.buildUpdateDto(size, dto)
    }
}