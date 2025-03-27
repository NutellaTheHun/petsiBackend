import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InventoryArea } from "../entities/inventory-area.entity";
import { InventoryAreaCountService } from "../services/inventory-area-count.service";
import { CreateInventoryAreaDto } from "../dto/create-inventory-area.dto";
import { UpdateInventoryAreaDto } from "../dto/update-inventory-area.dto";

@Injectable()
export class InventoryAreaBuilder {
    private area: InventoryArea;

    constructor(
        @Inject(forwardRef(() => InventoryAreaCountService))
        private readonly countService: InventoryAreaCountService,
    ){ this.reset(); }

    public reset(): this {
        this.area = new InventoryArea;
        return this;
    }

    public name(name: string): this {
        this.area.name = name;
        return this;
    }

    public async inventoryCountsById(ids: number[]): Promise<this> {
        this.area.inventoryCounts = await this.countService.findEntitiesById(ids);
        return this;
    }

    public getArea(): InventoryArea {
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
            await this.inventoryCountsById(dto.inventoryCountIds);
        }

        return this.getArea();
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
            await this.inventoryCountsById(dto.inventoryCountIds);
        }

        return this.getArea();
    }
}