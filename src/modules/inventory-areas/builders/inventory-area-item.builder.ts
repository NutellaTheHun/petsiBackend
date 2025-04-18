import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { InventoryItemSizeService } from "../../inventory-items/services/inventory-item-size.service";
import { InventoryItemService } from "../../inventory-items/services/inventory-item.service";
import { CreateInventoryAreaItemDto } from "../dto/create-inventory-area-item.dto";
import { UpdateInventoryAreaItemDto } from "../dto/update-inventory-area-item-count.dto";
import { InventoryAreaItem } from "../entities/inventory-area-item.entity";
import { InventoryAreaCountService } from "../services/inventory-area-count.service";
import { InventoryAreaService } from "../services/inventory-area.service";
import { InventoryAreaCount } from "../entities/inventory-area-count.entity";
import { InventoryAreaItemService } from "../services/inventory-area-item.service";
import { CreateInventoryItemSizeDto } from "../../inventory-items/dto/create-inventory-item-size.dto";
import { UpdateInventoryItemSizeDto } from "../../inventory-items/dto/update-inventory-item-size.dto";
import { InventoryItemSizeBuilder } from "../../inventory-items/builders/inventory-item-size.builder";

@Injectable()
export class InventoryAreaItemBuilder extends BuilderBase<InventoryAreaItem>{
    constructor(
        @Inject(forwardRef(() => InventoryAreaCountService))
        private readonly countService: InventoryAreaCountService,

        @Inject(forwardRef(() => InventoryAreaItemService))
        private readonly itemCountService: InventoryAreaItemService,
        
        private readonly areaService: InventoryAreaService,

        private readonly itemService: InventoryItemService,
        private readonly sizeService: InventoryItemSizeService,
        private readonly itemSizeBuilder: InventoryItemSizeBuilder,
    ){ super(InventoryAreaItem); }

    public inventoryAreaById(id: number): this {
        return this.setPropById(this.areaService.findOne.bind(this.areaService), 'inventoryArea', id);
    }

    public inventoryAreaByName(name: string): this {
        return this.setPropByName(this.areaService.findOne.bind(this.areaService), 'inventoryArea', name);
    }

    public inventoryItemById(id: number): this {
        return this.setPropById(this.itemService.findOne.bind(this.itemService), 'item', id);
    }

    public inventoryItemByName(name: string): this {
        return this.setPropByName(this.itemService.findOne.bind(this.itemService), 'item', name);
    }

    public unitAmount(amount: number): this {
        return this.setProp('unitAmount', amount);
    }

    public measureAmount(amount: number): this {
        return this.setProp('measureAmount', amount);
    }

    public sizeById(id: number): this {
        return this.setPropById(this.sizeService.findOne.bind(this.sizeService), 'size', id);
    }

    public sizeByBuilderAfter(inventoryItemId: number, dto: (CreateInventoryItemSizeDto | UpdateInventoryItemSizeDto)): this {
        const enrichedDto = {
            ...dto,
            inventoryItemId,
        }
        return this.setPropAfterBuild(this.itemSizeBuilder.buildDto.bind(this.itemSizeBuilder), 'size', this.entity, enrichedDto)
    }

    public areaCountById(id: number): this {
        return this.setPropById(this.countService.findOne.bind(this.countService), 'areaCount', id);
    }

    public async buildCreateDto(parentCount: InventoryAreaCount, dto: CreateInventoryAreaItemDto): Promise<InventoryAreaItem> {
        this.reset();

        /*if(dto.areaCountId){
            this.areaCountById(dto.areaCountId);
        }*/
        this.entity.areaCount = parentCount;

        if(dto.inventoryAreaId){
           this.inventoryAreaById(dto.inventoryAreaId);
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

        // a counted item's size can either be created on the fly, or a pre-existing item size
        if(dto.itemSizeDto){
            this.sizeByBuilderAfter(dto.inventoryItemId, dto.itemSizeDto);
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
        if(dto.inventoryAreaId){
            this.inventoryAreaById(dto.inventoryAreaId);
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
            this.sizeByBuilderAfter(dto.inventoryItemId, dto.itemSizeDto);
        }
        else if(dto.itemSizeId){
            this.sizeById(dto.itemSizeId);
        }

        return await this.build();
    }

    public async buildManyDto(parentCount: InventoryAreaCount, dtos: (CreateInventoryAreaItemDto | UpdateInventoryAreaItemDto)[]): Promise<InventoryAreaItem[]> {
        const results: InventoryAreaItem[] = [];
        for(const dto of dtos){
            if(dto.mode === 'create'){
                results.push(await this.buildCreateDto(parentCount, dto))
            } else {
                const countedItem = await this.itemCountService.findOne(dto.id, ['areaCount', 'inventoryArea', 'item', 'size'])
                if(!countedItem){ throw new Error("counted item is null"); }
                results.push(await this.buildUpdateDto(countedItem, dto));
            }
        }
        return results;
    }
}