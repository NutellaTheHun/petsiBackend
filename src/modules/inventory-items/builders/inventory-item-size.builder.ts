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
import { InventoryItemSizeValidator } from "../validators/inventory-item-size.validator";
import { CreateChildInventoryItemSizeDto } from "../dto/create-child-inventory-item-size.dto";
import { UpdateChildInventoryItemSizeDto } from "../dto/update-child-inventory-item-size.dto";

@Injectable()
export class InventoryItemSizeBuilder extends BuilderBase<InventoryItemSize> implements IBuildChildDto<InventoryItem, InventoryItemSize>{
    
    constructor(
        @Inject(forwardRef(() => InventoryItemService))
        private readonly itemService: InventoryItemService,

        @Inject(forwardRef(() => InventoryItemSizeService))
        private readonly sizeService: InventoryItemSizeService,

        validator: InventoryItemSizeValidator,
        private readonly packageService: InventoryItemPackageService,
        private readonly unitService: UnitOfMeasureService,
    ){ super(InventoryItemSize, validator); }

    protected async createEntity(dto: CreateInventoryItemSizeDto): Promise<void> {
        if(dto.inventoryItemId){
            this.InventoryItemById(dto.inventoryItemId);
        }
        if(dto.inventoryPackageTypeId){
            this.packageById(dto.inventoryPackageTypeId);
        }
        if(dto.unitOfMeasureId){
            this.unitOfMeasureById(dto.unitOfMeasureId);
        }
    }

    protected async updateEntity(dto: UpdateInventoryItemSizeDto): Promise<void> {
        if(dto.inventoryPackageTypeId){
            this.packageById(dto.inventoryPackageTypeId);
        }
        if(dto.unitOfMeasureId){
            this.unitOfMeasureById(dto.unitOfMeasureId);
        }
    }

    /**
     * This function is called when updating an inventory-area-count, 
     * through creating/updating an inventory-area-item, 
     * which created or references an inventory-item-size
     * in this context the child is not to the parent(inventory-are-item), but the inventoryItem property, so parentItem is not used.
     * @param parentItem not used in this instance
     * @param dto 
     * @returns 
     */
    async buildChildCreateDto(parentItem: InventoryItem, dto: CreateChildInventoryItemSizeDto): Promise<InventoryItemSize> {
        await this.validateCreateDto(dto);

        this.reset();
        
        this.entity.item = parentItem;

        await this.buildChildEntity(dto);

        return await this.build();
    }

    async buildChildEntity(dto: CreateChildInventoryItemSizeDto): Promise<void> {
        if(dto.inventoryPackageTypeId){
            this.packageById(dto.inventoryPackageTypeId);
        }
        
        if(dto.unitOfMeasureId){
            this.unitOfMeasureById(dto.unitOfMeasureId);
        }
    }

    /**
     * Builds InventoryItemSize entities from either Create or UpdateDTOs, input dtos can be an array mixed with both create and update.
     */
    public async buildManyChildDto(parentItem: InventoryItem, dtos: (CreateChildInventoryItemSizeDto | UpdateChildInventoryItemSizeDto)[]): Promise<InventoryItemSize[]> {
        const results: InventoryItemSize[] = [];
        for(const dto of dtos){
            if(dto.mode === 'create'){
                results.push( await this.buildChildCreateDto(parentItem, dto));
            } else {
                const size = await this.sizeService.findOne(dto.id);
                if(!size){ throw new Error("item size not found"); }
                results.push(await this.buildUpdateDto(size, dto));
            }
        }
        return results;
    }

    /**
     * Called when creating/updating inventory-area-item
     * @param parentItem Not required in this instance, but is kept to follow the builderbase.setPropByBuilder signature
     * @param dto 
     * @returns 
     */
    public async buildDto(parentItem: InventoryItem, dto: (CreateChildInventoryItemSizeDto | UpdateChildInventoryItemSizeDto)): Promise<InventoryItemSize> {
        if(dto.mode === 'create'){
            return await this.buildCreateDto(dto);
        }
        const size = await this.sizeService.findOne(dto.id);
        if(!size){ throw new Error("item size not found"); }
        return await this.buildUpdateDto(size, dto);
    }
    
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
}