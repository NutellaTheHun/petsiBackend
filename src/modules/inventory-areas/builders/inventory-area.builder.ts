import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { CreateInventoryAreaDto } from "../dto/create-inventory-area.dto";
import { UpdateInventoryAreaDto } from "../dto/update-inventory-area.dto";
import { InventoryArea } from "../entities/inventory-area.entity";
import { InventoryAreaCountService } from "../services/inventory-area-count.service";
import { InventoryAreaValidator } from "../validators/inventory-area.validator";

@Injectable()
export class InventoryAreaBuilder extends BuilderBase<InventoryArea>{
    constructor(
        @Inject(forwardRef(() => InventoryAreaCountService))
        private readonly countService: InventoryAreaCountService,
        validator: InventoryAreaValidator,
    ){ super(InventoryArea, validator); }

    public name(name: string): this {
        return this.setProp('name', name);
    }

    public inventoryCountsById(ids: number[]): this {
        return this.setPropsByIds(this.countService.findEntitiesById.bind(this.countService), 'inventoryCounts', ids);
    }

    protected async createEntity(dto: CreateInventoryAreaDto): Promise<void> {
        if(dto.name){
            this.name(dto.name);
        }
    }

    protected async updateEntity(dto: UpdateInventoryAreaDto): Promise<void> {
        if(dto.name){
            this.name(dto.name);
        }
        if(dto.inventoryCountIds){
            this.inventoryCountsById(dto.inventoryCountIds);
        }
    }
}