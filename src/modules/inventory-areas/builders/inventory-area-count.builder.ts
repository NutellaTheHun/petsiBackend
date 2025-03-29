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
    private taskQueue: (() => Promise<void>)[];

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
        this.taskQueue = [];
        return this;
    }

    public inventoryAreaById(id: number): this {
        this.taskQueue.push(async () => {
            await this.areaMethods.entityById(
                (area) => {this.count.inventoryArea = area; },
                id,
            );
        });
        return this;
    }

    public inventoryAreaByName(name: string): this {
        this.taskQueue.push(async () => {
            await this.areaMethods.entityByName(
                (area) => {this.count.inventoryArea = area; },
                name,
            );
        });
        return this;
    }

    public countedItemsById(ids: number[]): this {
        this.taskQueue.push(async () => {
            await this.areaItemMethods.entityByIds(
                (items) => {this.count.items = items},
                ids,
            );
        });
        return this;
    }

    public async build(): Promise<InventoryAreaCount> {
        for(const task of this.taskQueue){
            await task();
        }
        const result = this.count;
        this.reset();
        return result;
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

    public updateCount(toUpdate: InventoryAreaCount): this {
        this.count = toUpdate;
        return this;
    }

    public async buildUpdateDto(toUpdate: InventoryAreaCount, dto: UpdateInventoryAreaCountDto): Promise<InventoryAreaCount> {
        this.reset();
        this.updateCount(toUpdate);

        if(dto.inventoryAreaId){
            this.inventoryAreaById(dto.inventoryAreaId);
        }
        if(dto.inventoryItemCountIds){
            this.countedItemsById(dto.inventoryItemCountIds);
        }

        return await this.build();
    }
}