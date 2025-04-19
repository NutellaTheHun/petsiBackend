import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { CreateInventoryAreaCountDto } from "../dto/create-inventory-area-count.dto";
import { UpdateInventoryAreaCountDto } from "../dto/update-inventory-area-count.dto";
import { InventoryAreaCount } from "../entities/inventory-area-count.entity";
import { InventoryAreaItemService } from "../services/inventory-area-item.service";
import { InventoryAreaService } from "../services/inventory-area.service";
import { CreateInventoryAreaItemDto } from "../dto/create-inventory-area-item.dto";
import { UpdateInventoryAreaItemDto } from "../dto/update-inventory-area-item-count.dto";
import { InventoryAreaItemBuilder } from "./inventory-area-item.builder";

@Injectable()
export class InventoryAreaCountBuilder extends BuilderBase<InventoryAreaCount>{
    constructor(
        private readonly areaService: InventoryAreaService,
        private readonly areaItemService: InventoryAreaItemService,
        private readonly itemCountBuilder: InventoryAreaItemBuilder,
    ){ super(InventoryAreaCount); }

    public inventoryAreaById(id: number): this {
        return this.setPropById(this.areaService.findOne.bind(this.areaService), 'inventoryArea', id);
    }

    public inventoryAreaByName(name: string): this {
        return this.setPropByName(this.areaService.findOneByName.bind(this.areaService), 'inventoryArea', name);
    }

    public countedItemsById(ids: number[]): this {
        return this.setPropsByIds(this.areaItemService.findEntitiesById.bind(this.areaItemService), 'items', ids);
    }

    public countedItemsByBuilderAfter(areaCountId: number, dtos: (CreateInventoryAreaItemDto | UpdateInventoryAreaItemDto)[]): this{
        const enrichedDtos = dtos.map( dto => ({
            ...dto,
            areaCountId,
        }));
        return this.setPropAfterBuild(this.itemCountBuilder.buildManyDto.bind(this.itemCountBuilder), 'items', this.entity, enrichedDtos);
    }

    /**
     * @param dto Must have an inventoryAreaId, WARNING: inventoryItemCountIds are not used in creation. Only in updates.
     * @returns 
     */
    public async buildCreateDto(dto: CreateInventoryAreaCountDto): Promise<InventoryAreaCount> {
        this.reset();

        if(dto.inventoryAreaId){
            this.inventoryAreaById(dto.inventoryAreaId);
        }
        /*
        if(dto.inventoryItemCountIds){
            this.countedItemsById(dto.inventoryItemCountIds);
        }
        */
        return await this.build();
    }

    public async buildUpdateDto(toUpdate: InventoryAreaCount, dto: UpdateInventoryAreaCountDto): Promise<InventoryAreaCount> {
        this.reset();
        this.updateEntity(toUpdate);

        if(dto.inventoryAreaId){
            this.inventoryAreaById(dto.inventoryAreaId);
        }
        /*
        if(dto.inventoryItemCountIds){
            this.countedItemsById(dto.inventoryItemCountIds);
        }*/
        if(dto.itemCountDtos){
            this.countedItemsByBuilderAfter(this.entity.id, dto.itemCountDtos);
        }

        return await this.build();
    }
}