import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { RequestContextService } from "../../request-context/RequestContextService";
import { AppLogger } from "../../app-logging/app-logger";
import { CreateInventoryAreaDto } from "../dto/inventory-area/create-inventory-area.dto";
import { UpdateInventoryAreaDto } from "../dto/inventory-area/update-inventory-area.dto";
import { InventoryArea } from "../entities/inventory-area.entity";
import { InventoryAreaCountService } from "../services/inventory-area-count.service";
import { InventoryAreaValidator } from "../validators/inventory-area.validator";

@Injectable()
export class InventoryAreaBuilder extends BuilderBase<InventoryArea>{
    constructor(
        @Inject(forwardRef(() => InventoryAreaCountService))
        private readonly countService: InventoryAreaCountService,
        logger: AppLogger,
        validator: InventoryAreaValidator,
        requestContextService: RequestContextService,
    ){ super(InventoryArea, 'InventoryAreaBuilder', requestContextService, logger, validator); }

    protected createEntity(dto: CreateInventoryAreaDto): void {
        if(dto.name){
            this.name(dto.name);
        }
    }

    protected updateEntity(dto: UpdateInventoryAreaDto): void {
        if(dto.name){
            this.name(dto.name);
        }
        if(dto.inventoryCountIds){
            this.inventoryCountsById(dto.inventoryCountIds);
        }
    }

    public name(name: string): this {
        return this.setPropByVal('name', name);
    }

    public inventoryCountsById(ids: number[]): this {
        return this.setPropsByIds(this.countService.findEntitiesById.bind(this.countService), 'inventoryCounts', ids);
    }
}