import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { CreateInventoryAreaCountDto } from "../dto/create-inventory-area-count.dto";
import { UpdateInventoryAreaCountDto } from "../dto/update-inventory-area-count.dto";
import { InventoryAreaCount } from "../entities/inventory-area-count.entity";
import { InventoryAreaItemCountService } from "../services/inventory-area-item-count.service";
import { InventoryAreaService } from "../services/inventory-area.service";

@Injectable()
export class InventoryAreaCountBuilder extends BuilderBase<InventoryAreaCount>{
    constructor(
        @Inject(forwardRef(() => InventoryAreaService))
        private readonly areaService: InventoryAreaService,
        
        @Inject(forwardRef(() => InventoryAreaItemCountService))
        private readonly areaItemService: InventoryAreaItemCountService,
    ){ super(InventoryAreaCount); }

    public inventoryAreaById(id: number): this {
        return this.setPropById(this.areaService.findOne.bind(this.areaService), 'inventoryArea', id);
    }

    public inventoryAreaByName(name: string): this {
        return this.setPropByName(this.areaService.findOne.bind(this.areaService), 'inventoryArea', name);
    }

    public countedItemsById(ids: number[]): this {
        return this.setPropsByIds(this.areaItemService.findOne.bind(this.areaItemService), 'items', ids);
    }

    public async buildCreateDto(dto: CreateInventoryAreaCountDto): Promise<InventoryAreaCount> {
        this.reset();

        if(dto.inventoryAreaId){
            this.inventoryAreaById(dto.inventoryAreaId);
        }
        if(dto.inventoryItemCountIds){
            this.countedItemsById(dto.inventoryItemCountIds);
        }

        return await this.build();
    }

    public async buildUpdateDto(toUpdate: InventoryAreaCount, dto: UpdateInventoryAreaCountDto): Promise<InventoryAreaCount> {
        this.reset();
        this.updateEntity(toUpdate);

        if(dto.inventoryAreaId){
            this.inventoryAreaById(dto.inventoryAreaId);
        }
        if(dto.inventoryItemCountIds){
            this.countedItemsById(dto.inventoryItemCountIds);
        }

        return await this.build();
    }
}