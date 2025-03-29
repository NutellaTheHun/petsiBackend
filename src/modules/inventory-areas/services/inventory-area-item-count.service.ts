import { forwardRef, Inject, NotImplementedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { InventoryItemService } from "../../inventory-items/services/inventory-item.service";
import { InventoryAreaItemCountBuilder } from "../builders/inventory-area-item-count.builder";
import { CreateInventoryAreaItemCountDto } from "../dto/create-inventory-area-item-count.dto";
import { UpdateInventoryAreaItemCountDto } from "../dto/update-inventory-area-item-count.dto";
import { InventoryAreaItemCount } from "../entities/inventory-area-item-count.entity";
import { InventoryAreaService } from "./inventory-area.service";

export class InventoryAreaItemCountService extends ServiceBase<InventoryAreaItemCount> {
    constructor(
        @InjectRepository(InventoryAreaItemCount)
        private readonly itemCountRepo: Repository<InventoryAreaItemCount>,

        @Inject(forwardRef(() => InventoryAreaItemCountBuilder))
        private readonly itemCountBuilder: InventoryAreaItemCountBuilder,

        @Inject(forwardRef(() => InventoryAreaService))
        private readonly inventoryAreaService: InventoryAreaService,

        @Inject(forwardRef(() => InventoryItemService))
        private readonly itemService: InventoryItemService,
    ){ super(itemCountRepo); }

    /**
     * - InventoryItemSize property can be either created or a pre-existing entity on this create call.
     * - If InventoryItemSize is new, a new itemSize is created at the controller level, and its ID is assigned to
     *   the DTO and passed to this method.
     * - Requires the parent inventoryAreaCount and InventoryArea entities to already exist
     */
    async create(dto: CreateInventoryAreaItemCountDto): Promise<InventoryAreaItemCount | null> {
        const countedItem = await this.itemCountBuilder.buildCreateDto(dto);
        return this.itemCountRepo.save(countedItem);
    }

    /**
     * Uses Repository.Save(), NOT Update()
     * - If the inventoryItem changes, the itemSize must also change.
     * Updating an itemCount could contain a new InventoryItemSize entity, if so, a new size is created at controller level and its
     * Id is assigned to this DTO before being passed to this method.
     */
    async update(id: number, dto: UpdateInventoryAreaItemCountDto): Promise< InventoryAreaItemCount | null> {
        if(dto.inventoryItemId && !dto.itemSizeId){ 
            throw new Error('updated itemCount attempt to change item without new item size'); 
        }
        
        const toUpdate = await this.findOne(id);
        if(!toUpdate){ 
            return null;
        }

        await this.itemCountBuilder.buildUpdateDto(toUpdate, dto);
        return await this.itemCountRepo.save(toUpdate);
    }

    async findByAreaName(name: string, relations?: string[]): Promise<InventoryAreaItemCount[]> {
        const area = await this.inventoryAreaService.findOneByName(name);
        if(!area){ throw new Error('inventory area not found'); }

        return await this.itemCountRepo.find({ 
            where: { inventoryArea: { name: name } }, 
            relations
        });
    }

    async findByItemName(name: string, relations?: string[]): Promise<InventoryAreaItemCount[]> {
        const item = await this.itemService.findOneByName(name);
        if(!item){ throw new Error('inventory item not found'); }

        return await this.itemCountRepo.find({ 
            where: { item: { id: item.id } }, 
            relations
        });
    }
}