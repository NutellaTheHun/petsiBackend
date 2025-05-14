import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { CreateChildInventoryAreaItemDto } from "../dto/create-child-inventory-area-item.dto";
import { CreateInventoryAreaCountDto } from "../dto/create-inventory-area-count.dto";
import { UpdateChildInventoryAreaItemDto } from "../dto/update-child-inventory-area-item.dto";
import { UpdateInventoryAreaCountDto } from "../dto/update-inventory-area-count.dto";
import { InventoryAreaCount } from "../entities/inventory-area-count.entity";
import { InventoryAreaItemService } from "../services/inventory-area-item.service";
import { InventoryAreaService } from "../services/inventory-area.service";
import { InventoryAreaCountValidator } from "../validators/inventory-area-count.validator";
import { InventoryAreaItemBuilder } from "./inventory-area-item.builder";
import { RequestContextService } from "../../request-context/RequestContextService";
import { ModuleRef } from "@nestjs/core";
import { AppLogger } from "../../app-logging/app-logger";

@Injectable()
export class InventoryAreaCountBuilder extends BuilderBase<InventoryAreaCount>{
    constructor(
        @Inject(forwardRef(() => InventoryAreaService))
        private readonly areaService: InventoryAreaService,
        
        @Inject(forwardRef(() => InventoryAreaItemService))
        private readonly areaItemService: InventoryAreaItemService,

        @Inject(forwardRef(() => InventoryAreaItemBuilder))
        private readonly itemCountBuilder: InventoryAreaItemBuilder,

        logger: AppLogger,

        validator: InventoryAreaCountValidator,

        requestContextService: RequestContextService,
    ){ super(InventoryAreaCount, 'InventoryAreaCountBuilder', requestContextService, logger, validator); }

    protected createEntity(dto: CreateInventoryAreaCountDto): void{
        if(dto.inventoryAreaId){
            this.inventoryAreaById(dto.inventoryAreaId);
        }
    }

    protected updateEntity(dto: UpdateInventoryAreaCountDto): void{
        if(dto.inventoryAreaId){
            this.inventoryAreaById(dto.inventoryAreaId);
        }
        if(dto.itemCountDtos){
            // Requires passing the parent when the area-count update requires creating a new area-item
            this.countedItemsByBuilder(this.entity, dto.itemCountDtos);
        }
    }

    public inventoryAreaById(id: number): this {
        return this.setPropById(this.areaService.findOne.bind(this.areaService), 'inventoryArea', id);
    }

    public inventoryAreaByName(name: string): this {
        return this.setPropByName(this.areaService.findOneByName.bind(this.areaService), 'inventoryArea', name);
    }

    public countedItemsById(ids: number[]): this {
        return this.setPropsByIds(this.areaItemService.findEntitiesById.bind(this.areaItemService), 'items', ids);
    }

    public countedItemsByBuilder(parent: InventoryAreaCount, dtos: (CreateChildInventoryAreaItemDto | UpdateChildInventoryAreaItemDto)[]): this{
        const enrichedDtos = dtos.map( dto => ({
            ...dto,
            areaCountId: parent.id,
        }));
        return this.setPropByBuilder(this.itemCountBuilder.buildManyChildDto.bind(this.itemCountBuilder), 'items', parent, enrichedDtos);
    }
}