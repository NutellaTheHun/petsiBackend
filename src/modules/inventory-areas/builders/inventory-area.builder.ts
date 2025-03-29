import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InventoryArea } from "../entities/inventory-area.entity";
import { InventoryAreaCountService } from "../services/inventory-area-count.service";
import { CreateInventoryAreaDto } from "../dto/create-inventory-area.dto";
import { UpdateInventoryAreaDto } from "../dto/update-inventory-area.dto";
import { BuilderMethodBase } from "../../../base/builder-method-base";
import { InventoryAreaCount } from "../entities/inventory-area-count.entity";

@Injectable()
export class InventoryAreaBuilder {
    private area: InventoryArea;
    private taskQueue: (() => Promise<void>)[];
    private countMethods: BuilderMethodBase<InventoryAreaCount>;

    constructor(
        @Inject(forwardRef(() => InventoryAreaCountService))
        private readonly countService: InventoryAreaCountService,
    ){ 
        this.reset();
        this.countMethods = new BuilderMethodBase(this.countService);
    }

    public reset(): this {
        this.area = new InventoryArea;
        this.taskQueue = [];
        return this;
    }

    public name(name: string): this {
        this.area.name = name;
        return this;
    }

    public inventoryCountsById(ids: number[]): this {
        this.taskQueue.push(async () => {
            await this.countMethods.entityByIds(
                (counts) => { this.area.inventoryCounts = counts; },
                ids,
            );
        });
        return this;
    }

    public async build(): Promise<InventoryArea> {
        for(const task of this.taskQueue){
            await task();
        }

        const result = this.area;
        this.reset();
        return result;
    }

    public async buildCreateDto(dto: CreateInventoryAreaDto): Promise<InventoryArea> {
        this.reset();

        if(dto.name){
            this.name(dto.name);
        }
        if(dto.inventoryCountIds){
            this.inventoryCountsById(dto.inventoryCountIds);
        }

        return await this.build();
    }

    public updateArea(toUpdate: InventoryArea): this {
        this.area = toUpdate;
        return this;
    }

    public async buildUpdateDto(toUpdate: InventoryArea, dto: UpdateInventoryAreaDto): Promise<InventoryArea> {
        this.reset();
        this.updateArea(toUpdate);

        if(dto.name){
            this.name(dto.name);
        }
        if(dto.inventoryCountIds){
            this.inventoryCountsById(dto.inventoryCountIds);
        }

        return await this.build();
    }
}