import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InventoryAreaCount } from "../entities/inventory-area-count.entity";
import { InventoryAreaService } from "../services/inventory-area.service";
import { InventoryAreaItemCountService } from "../services/inventory-area-item-count.service";
import { CreateInventoryAreaCountDto } from "../dto/create-inventory-area-count.dto";
import { UpdateInventoryAreaCountDto } from "../dto/update-inventory-area-count.dto";


@Injectable()
export class InventoryAreaCountBuilder {
    private count: InventoryAreaCount;

    constructor(
        @Inject(forwardRef(() => InventoryAreaService))
        private readonly areaService: InventoryAreaService,
        
        @Inject(forwardRef(() => InventoryAreaItemCountService))
        private readonly areaItemService: InventoryAreaItemCountService,
    ){ this.reset(); }

    public reset(): this {
        this.count = new InventoryAreaCount;
        return this;
    }

    public async inventoryAreaById(id: number): Promise<this> {
        const area = await this.areaService.findOne(id);
        if(!area){
            throw new Error("inventory area not found");
        }

        this.count.inventoryArea = area;
        return this;
    }

    public async inventoryAreaByName(name: string): Promise<this> {
        const area = await this.areaService.findOneByName(name);
        if(!area){
            throw new Error("inventory area not found");
        }

        this.count.inventoryArea = area;
        return this;
    }

    public async countedItemsById(ids: number[]): Promise<this> {
        this.count.items = await this.areaItemService.findEntitiesById(ids);
        return this;
    }

    public getAreaCount(): InventoryAreaCount {
        const result = this.count;
        this.reset();
        return result;
    }

    public async buildCreateDto(dto: CreateInventoryAreaCountDto): Promise<InventoryAreaCount> {
        this.reset();

        if(dto.inventoryAreaId){
            await this.inventoryAreaById(dto.inventoryAreaId);
        }

        if(dto.inventoryItemCountIds){
            await this.countedItemsById(dto.inventoryItemCountIds);
        }

        return this.getAreaCount();
    }

    public updateCount(toUpdate: InventoryAreaCount): this {
        this.count = toUpdate;
        return this;
    }

    public async buildUpdateDto(toUpdate: InventoryAreaCount, dto: UpdateInventoryAreaCountDto): Promise<InventoryAreaCount> {
        this.reset();

        this.updateCount(toUpdate);

        if(dto.inventoryAreaId){
            await this.inventoryAreaById(dto.inventoryAreaId);
        }

        if(dto.inventoryItemCountIds){
            await this.countedItemsById(dto.inventoryItemCountIds);
        }

        return this.getAreaCount();
    }
}