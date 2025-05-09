import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { CreateInventoryAreaDto } from "../dto/create-inventory-area.dto";
import { UpdateInventoryAreaDto } from "../dto/update-inventory-area.dto";
import { InventoryArea } from "../entities/inventory-area.entity";
import { InventoryAreaCountService } from "../services/inventory-area-count.service";

@Injectable()
export class InventoryAreaBuilder extends BuilderBase<InventoryArea>{
    constructor(
        @Inject(forwardRef(() => InventoryAreaCountService))
        private readonly countService: InventoryAreaCountService,
    ){ super(InventoryArea); }

    public name(name: string): this {
        return this.setProp('name', name);
    }

    public inventoryCountsById(ids: number[]): this {
        return this.setPropsByIds(this.countService.findEntitiesById.bind(this.countService), 'inventoryCounts', ids);
    }

    public async buildCreateDto(dto: CreateInventoryAreaDto): Promise<InventoryArea> {
        this.reset();

        if(dto.name){
            this.name(dto.name);
        }

        return await this.build();
    }

    public async buildUpdateDto(toUpdate: InventoryArea, dto: UpdateInventoryAreaDto): Promise<InventoryArea> {
        this.reset();
        this.updateEntity(toUpdate);

        if(dto.name){
            this.name(dto.name);
        }
        if(dto.inventoryCountIds){
            this.inventoryCountsById(dto.inventoryCountIds);
        }

        return await this.build();
    }
}