import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { InventoryItemSizeService } from "../../inventory-items/services/inventory-item-size.service";
import { InventoryItemService } from "../../inventory-items/services/inventory-item.service";
import { CreateInventoryAreaItemDto } from "../dto/create-inventory-area-item.dto";
import { UpdateInventoryAreaItemDto } from "../dto/update-inventory-area-item.dto";
import { InventoryAreaItem } from "../entities/inventory-area-item.entity";
import { InventoryAreaCountService } from "../services/inventory-area-count.service";
import { InventoryAreaCount } from "../entities/inventory-area-count.entity";
import { InventoryAreaItemService } from "../services/inventory-area-item.service";
import { CreateInventoryItemSizeDto } from "../../inventory-items/dto/create-inventory-item-size.dto";
import { UpdateInventoryItemSizeDto } from "../../inventory-items/dto/update-inventory-item-size.dto";
import { InventoryItemSizeBuilder } from "../../inventory-items/builders/inventory-item-size.builder";
import { IBuildChildDto } from "../../../base/interfaces/IBuildChildEntity.interface";

@Injectable()
export class InventoryAreaItemBuilder extends BuilderBase<InventoryAreaItem> 
implements IBuildChildDto<InventoryAreaCount, InventoryAreaItem>{
    constructor(
        @Inject(forwardRef(() => InventoryAreaCountService))
        private readonly countService: InventoryAreaCountService,

        @Inject(forwardRef(() => InventoryAreaItemService))
        private readonly itemCountService: InventoryAreaItemService,
        
        private readonly itemService: InventoryItemService,
        private readonly sizeService: InventoryItemSizeService,
        private readonly itemSizeBuilder: InventoryItemSizeBuilder,
    ){ super(InventoryAreaItem); }

    public inventoryItemById(id: number): this {
        return this.setPropById(this.itemService.findOne.bind(this.itemService), 'item', id);
    }

    public inventoryItemByName(name: string): this {
        return this.setPropByName(this.itemService.findOne.bind(this.itemService), 'item', name);
    }

    public unitAmount(amount: number): this {
        if(amount === 0){
            return this.setProp('unitAmount', 1);
        }
        return this.setProp('unitAmount', amount);
    }

    public measureAmount(amount: number): this {
        return this.setProp('measureAmount', amount);
    }

    public sizeById(id: number): this {
        return this.setPropById(this.sizeService.findOne.bind(this.sizeService), 'size', id);
    }

    public sizeByBuilder(inventoryItemId: number, dto: (CreateInventoryItemSizeDto | UpdateInventoryItemSizeDto)): this {
        const enrichedDto = {
            ...dto,
            inventoryItemId,
        }
        return this.setPropByBuilder(this.itemSizeBuilder.buildDto.bind(this.itemSizeBuilder), 'size', this.entity, enrichedDto);
    }

    public areaCountById(id: number): this {
        return this.setPropById(this.countService.findOne.bind(this.countService), 'areaCount', id);
    }

    /**
     * - Called when an inventory area item is being created as a property of a parent entity that is actively being 
     * created or updated (containing nested dtos).
     * - Passes the reference of the parent because the parent entity might not be in the database yet. 
     */
    public async buildChildCreateDto(parentCount: InventoryAreaCount, dto: CreateInventoryAreaItemDto): Promise<InventoryAreaItem> {
        this.reset();

        this.entity.areaCount = parentCount;
        
        if(dto.inventoryItemId){
            this.inventoryItemById(dto.inventoryItemId);
        }
        if(dto.measureAmount){
            this.measureAmount(dto.measureAmount);
        }
        if(dto.unitAmount){
            this.unitAmount(dto.unitAmount);
        }

        // a counted item's size can either be created on the fly, or a pre-existing item size
        if(dto.itemSizeDto){
            this.sizeByBuilder(dto.inventoryItemId, dto.itemSizeDto);
        }
        else if(dto.itemSizeId){
            this.sizeById(dto.itemSizeId);
        }

        return await this.build();
    }

    public async buildCreateDto(dto: CreateInventoryAreaItemDto): Promise<InventoryAreaItem> {
        this.reset();

        if(dto.areaCountId){
            this.areaCountById(dto.areaCountId);
        }
        if(dto.inventoryItemId){
            this.inventoryItemById(dto.inventoryItemId);
        }
        if(dto.measureAmount){
            this.measureAmount(dto.measureAmount);
        }

        if(dto.unitAmount){
            this.unitAmount(dto.unitAmount);
        } else {
            this.unitAmount(1); // defauilt amount
        }

        // a counted item's size can be created either on the fly, or a pre-existing item size
        if(dto.itemSizeDto){
            this.sizeByBuilder(dto.inventoryItemId, dto.itemSizeDto);
        }
        else if(dto.itemSizeId){
            this.sizeById(dto.itemSizeId);
        }

        return await this.build();
    }

    public async buildUpdateDto(toUpdate: InventoryAreaItem, dto: UpdateInventoryAreaItemDto): Promise<InventoryAreaItem> {
        this.reset();
        this.updateEntity(toUpdate);

        if(dto.areaCountId){
            this.areaCountById(dto.areaCountId);
        }
        if(dto.inventoryItemId){
            this.inventoryItemById(dto.inventoryItemId);
        }
        if(dto.measureAmount){
            this.measureAmount(dto.measureAmount);
        }
        if(dto.unitAmount){
            this.unitAmount(dto.unitAmount);
        }

        // a counted item's size can either be created on the fly, updated on the fly, or a pre-existing item size
        if(dto.itemSizeDto){
            this.sizeByBuilder(dto.inventoryItemId, dto.itemSizeDto);
        }
        else if(dto.itemSizeId){
            this.sizeById(dto.itemSizeId);
        }

        return await this.build();
    }

    public async buildManyChildDto(parentCount: InventoryAreaCount, dtos: (CreateInventoryAreaItemDto | UpdateInventoryAreaItemDto)[]): Promise<InventoryAreaItem[]> {
        const results: InventoryAreaItem[] = [];
        for(const dto of dtos){
            if(dto.mode === 'create'){
                results.push(await this.buildChildCreateDto(parentCount, dto))
            } else {
                const countedItem = await this.itemCountService.findOne(dto.id);
                if(!countedItem){ throw new Error("counted item is null"); }
                results.push(await this.buildUpdateDto(countedItem, dto));
            }
        }
        return results;
    }
}