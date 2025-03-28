import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InventoryAreaCount } from "../entities/inventory-area-count.entity";
import { InventoryAreaService } from "../services/inventory-area.service";
import { InventoryAreaItemCountService } from "../services/inventory-area-item-count.service";
import { CreateInventoryAreaCountDto } from "../dto/create-inventory-area-count.dto";
import { UpdateInventoryAreaCountDto } from "../dto/update-inventory-area-count.dto";
import { BuilderMethodBase } from "../../../base/builder-method-base";
import { InventoryArea } from "../entities/inventory-area.entity";
import { InventoryAreaItemCount } from "../entities/inventory-area-item-count.entity";


@Injectable()
export class InventoryAreaCountBuilder {
    private count: InventoryAreaCount;
    private areaMethods: BuilderMethodBase<InventoryArea>;
    private areaItemMethods: BuilderMethodBase<InventoryAreaItemCount>;

    constructor(
        @Inject(forwardRef(() => InventoryAreaService))
        private readonly areaService: InventoryAreaService,
        
        @Inject(forwardRef(() => InventoryAreaItemCountService))
        private readonly areaItemService: InventoryAreaItemCountService,
    ){ 
        this.reset(); 
        this.areaMethods = new BuilderMethodBase(this.areaService, this.areaService.findOneByName.bind(this.areaService));
        this.areaItemMethods = new BuilderMethodBase(this.areaItemService);
    }

    public reset(): this {
        this.count = new InventoryAreaCount;
        return this;
    }

    public async inventoryAreaById(id: number): Promise<this> {
        await this.areaMethods.entityById(
            (area) => {this.count.inventoryArea = area; },
            id,
        );
        return this;
    }

    public async inventoryAreaByName(name: string): Promise<this> {
        await this.areaMethods.entityByName(
            (area) => {this.count.inventoryArea = area; },
            name,
        );
        return this;
    }

    public async countedItemsById(ids: number[]): Promise<this> {
        await this.areaItemMethods.entityByIds(
            (items) => {this.count.items = items},
            ids,
        );
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