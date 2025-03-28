import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InventoryAreaItemCount } from "../entities/inventory-area-item-count.entity";
import { InventoryAreaService } from "../services/inventory-area.service";
import { InventoryAreaCountService } from "../services/inventory-area-count.service";
import { InventoryItemSizeService } from "../../inventory-items/services/inventory-item-size.service";
import { InventoryItemService } from "../../inventory-items/services/inventory-item.service";
import { CreateInventoryAreaItemCountDto } from "../dto/create-inventory-area-item-count.dto";
import { UpdateInventoryAreaItemCountDto } from "../dto/update-inventory-area-item-count.dto";
import { BuilderMethodBase } from "../../../base/builder-method-base";
import { InventoryAreaCount } from "../entities/inventory-area-count.entity";
import { InventoryArea } from "../entities/inventory-area.entity";
import { InventoryItem } from "../../inventory-items/entities/inventory-item.entity";
import { InventoryItemSize } from "../../inventory-items/entities/inventory-item-size.entity";

@Injectable()
export class InventoryAreaItemCountBuilder {
    private countedItem: InventoryAreaItemCount;
    private areaCountMethods: BuilderMethodBase<InventoryAreaCount>;
    private areaMethods: BuilderMethodBase<InventoryArea>;
    private itemMethods: BuilderMethodBase<InventoryItem>;
    private itemSizeMethods: BuilderMethodBase<InventoryItemSize>;

    constructor(
        @Inject(forwardRef(() => InventoryAreaCountService))
        private readonly areaCountService: InventoryAreaCountService,

        private readonly inventoryAreaService: InventoryAreaService,

        @Inject(forwardRef(() => InventoryItemService))
        private readonly itemService: InventoryItemService,

        @Inject(forwardRef(() => InventoryItemSizeService))
        private readonly itemSizeService: InventoryItemSizeService,
    ){ 
        this.reset();
        this.areaCountMethods = new BuilderMethodBase(this.areaCountService);
        this.areaMethods = new BuilderMethodBase(this.inventoryAreaService, this.inventoryAreaService.findOneByName.bind(this.inventoryAreaService));
        this.itemMethods = new BuilderMethodBase(this.itemService, this.itemService.findOneByName.bind(this.itemService));
        this.itemSizeMethods = new BuilderMethodBase(this.itemSizeService);
    }

    public reset(): this {
        this.countedItem = new InventoryAreaItemCount();
        return this;
    }

    public async inventoryAreaById(id: number): Promise<this> {
        await this.areaMethods.entityById(
            (area) => {this.countedItem.inventoryArea = area},
            id,
        );
        return this;
    }

    public async inventoryAreaByName(name: string): Promise<this> {
        await this.areaMethods.entityByName(
            (area) => {this.countedItem.inventoryArea = area},
            name,
        );
        return this;
    }

    public async inventoryItemById(id: number): Promise<this> {
        await this.itemMethods.entityById(
            (item) => {this.countedItem.item = item},
            id,
        );
        return this;
    }

    public async inventoryItemByName(name: string): Promise<this> {
        await this.itemMethods.entityByName(
            (item) => {this.countedItem.item = item},
            name,
        );
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
        await this.itemSizeMethods.entityById(
            (size) => {this.countedItem.size = size},
            id,
        )
        return this;
    }

    public async areaCountById(id: number): Promise<this>{
        await this.areaCountMethods.entityById(
            (count) => {this.countedItem.areaCount = count},
            id,
        );
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