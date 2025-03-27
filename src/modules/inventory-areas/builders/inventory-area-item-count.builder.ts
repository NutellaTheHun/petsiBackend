import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InventoryAreaItemCount } from "../entities/inventory-area-item-count.entity";
import { InventoryAreaService } from "../services/inventory-area.service";
import { InventoryAreaCountService } from "../services/inventory-area-count.service";
import { InventoryItemSizeService } from "../../inventory-items/services/inventory-item-size.service";
import { InventoryItemService } from "../../inventory-items/services/inventory-item.service";
import { CreateInventoryAreaItemCountDto } from "../dto/create-inventory-area-item-count.dto";
import { UpdateInventoryAreaItemCountDto } from "../dto/update-inventory-area-item-count.dto";

@Injectable()
export class InventoryAreaItemCountBuilder {
    private countedItem: InventoryAreaItemCount;

    constructor(
        @Inject(forwardRef(() => InventoryAreaCountService))
        private readonly areaCountService: InventoryAreaCountService,

        private readonly inventoryAreaService: InventoryAreaService,

        @Inject(forwardRef(() => InventoryItemService))
        private readonly itemService: InventoryItemService,

        @Inject(forwardRef(() => InventoryItemSizeService))
        private readonly itemSizeService: InventoryItemSizeService,
    ){ this.reset(); }

    public reset(): this {
        this.countedItem = new InventoryAreaItemCount();
        return this;
    }

    public async inventoryAreaById(id: number): Promise<this> {
        const area = await this.inventoryAreaService.findOne(id);
        if(!area){
            throw new Error("inventory area not found");
        }

        this.countedItem.inventoryArea = area;
        return this;
    }

    public async inventoryAreaByName(name: string): Promise<this> {
        const area = await this.inventoryAreaService.findOneByName(name);
        if(!area){
            throw new Error("inventory area not found");
        }

        this.countedItem.inventoryArea = area;
        return this;
    }

    public async inventoryItemById(id: number): Promise<this> {
        const item = await this.itemService.findOne(id);
        if(!item){
            throw new Error("inventory area not found");
        }

        this.countedItem.item = item;
        return this;
    }

    public async inventoryItemByName(name: string): Promise<this> {
        const item = await this.itemService.findOneByName(name);
        if(!item){
            throw new Error("inventory area not found");
        }

        this.countedItem.item = item;
        return this;
    }

    public unitAmount(amount: number): this {
        this.countedItem.unitAmount = amount;
        return this;
    }

    public measureAmount(amount: number): this {
        this.countedItem.measureAmount = amount;
        return this;
    }

    public async sizesById(id: number): Promise<this> {
        const size = await this.itemSizeService.findOne(id);
        if(!size){
            throw new Error("item size not found");
        }

        this.countedItem.size = size;
        return this;
    }

    public async areaCountById(id: number): Promise<this>{
        const count = await this.areaCountService.findOne(id);
        if(!count){
            throw new Error("inventory count not found");
        }
        this.countedItem.areaCount = count;
        return this;
    }

    public getItem(): InventoryAreaItemCount {
        const result = this.countedItem;
        this.reset();
        return result;
    }

    public async buildCreateDto(dto: CreateInventoryAreaItemCountDto): Promise<InventoryAreaItemCount> {
        this.reset();

        if(dto.areaCountId){
            await this.areaCountById(dto.areaCountId);
        }

        if(dto.inventoryAreaId){
            await this.inventoryAreaById(dto.inventoryAreaId);
        }

        if(dto.inventoryItemId){
            await this.inventoryItemById(dto.inventoryItemId);
        }

        if(dto.itemSizeId){
            await this.sizesById(dto.itemSizeId);
        }

        if(dto.measureAmount){
            this.measureAmount(dto.measureAmount);
        }

        if(dto.unitAmount){
            this.unitAmount(dto.unitAmount);
        }

        return this.getItem();
    }

    public updateCountedItem(toUpdate: InventoryAreaItemCount): this {
        this.countedItem = toUpdate;
        return this;
    }

    public async buildUpdateDto(toUpdate: InventoryAreaItemCount, dto: UpdateInventoryAreaItemCountDto): Promise<InventoryAreaItemCount> {
        this.reset();

        this.updateCountedItem(toUpdate);

        if(dto.areaCountId){
            await this.areaCountById(dto.areaCountId);
        }

        if(dto.inventoryAreaId){
            await this.inventoryAreaById(dto.inventoryAreaId);
        }

        if(dto.inventoryItemId){
            await this.inventoryItemById(dto.inventoryItemId);
        }

        if(dto.itemSizeId){
            await this.sizesById(dto.itemSizeId);
        }

        if(dto.measureAmount){
            this.measureAmount(dto.measureAmount);
        }

        if(dto.unitAmount){
            this.unitAmount(dto.unitAmount);
        }

        return this.getItem();
    }
}