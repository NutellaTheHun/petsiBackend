import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { InventoryItemSizeService } from "../../inventory-items/services/inventory-item-size.service";
import { InventoryItemService } from "../../inventory-items/services/inventory-item.service";
import { CreateInventoryAreaItemCountDto } from "../dto/create-inventory-area-item-count.dto";
import { UpdateInventoryAreaItemCountDto } from "../dto/update-inventory-area-item-count.dto";
import { InventoryAreaItemCount } from "../entities/inventory-area-item-count.entity";
import { InventoryAreaCountService } from "../services/inventory-area-count.service";
import { InventoryAreaService } from "../services/inventory-area.service";

@Injectable()
export class InventoryAreaItemCountBuilder extends BuilderBase<InventoryAreaItemCount>{
    constructor(
        @Inject(forwardRef(() => InventoryAreaCountService))
        private readonly countService: InventoryAreaCountService,

        @Inject(forwardRef(() => InventoryAreaService))
        private readonly areaService: InventoryAreaService,

        @Inject(forwardRef(() => InventoryItemService))
        private readonly itemService: InventoryItemService,

        @Inject(forwardRef(() => InventoryItemSizeService))
        private readonly sizeService: InventoryItemSizeService,
    ){ super(InventoryAreaItemCount); }

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

    public areaCountById(id: number): this {
        return this.setPropById(this.countService.findOne.bind(this.countService), 'areaCount', id);
    }

    public async buildCreateDto(dto: CreateInventoryAreaItemCountDto): Promise<InventoryAreaItemCount> {
        this.reset();

        if(dto.areaCountId){
            this.areaCountById(dto.areaCountId);
        }
        if(dto.inventoryAreaId){
           this.inventoryAreaById(dto.inventoryAreaId);
        }
        if(dto.inventoryItemId){
            this.inventoryItemById(dto.inventoryItemId);
        }
        if(dto.itemSizeId){
            this.sizeById(dto.itemSizeId);
        }
        if(dto.measureAmount){
            this.measureAmount(dto.measureAmount);
        }
        if(dto.unitAmount){
            this.unitAmount(dto.unitAmount);
        }

        return await this.build();
    }

    public async buildUpdateDto(toUpdate: InventoryAreaItemCount, dto: UpdateInventoryAreaItemCountDto): Promise<InventoryAreaItemCount> {
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
        if(dto.itemSizeId){
            this.sizeById(dto.itemSizeId);
        }
        if(dto.measureAmount){
            this.measureAmount(dto.measureAmount);
        }
        if(dto.unitAmount){
            this.unitAmount(dto.unitAmount);
        }

        return await this.build();
    }
}