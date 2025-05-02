import { forwardRef, Inject, NotFoundException, NotImplementedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { InventoryItemService } from "../../inventory-items/services/inventory-item.service";
import { InventoryAreaItemBuilder } from "../builders/inventory-area-item.builder";
import { CreateInventoryAreaItemDto } from "../dto/create-inventory-area-item.dto";
import { UpdateInventoryAreaItemDto } from "../dto/update-inventory-area-item-count.dto";
import { InventoryAreaItem } from "../entities/inventory-area-item.entity";
import { InventoryAreaService } from "./inventory-area.service";
import { InventoryAreaCountService } from "./inventory-area-count.service";

export class InventoryAreaItemService extends ServiceBase<InventoryAreaItem> {
    constructor(
        @InjectRepository(InventoryAreaItem)
        private readonly itemCountRepo: Repository<InventoryAreaItem>,

        private readonly itemCountBuilder: InventoryAreaItemBuilder,

        private readonly inventoryAreaService: InventoryAreaService,

        @Inject(forwardRef(() => InventoryAreaCountService))
        private readonly countService: InventoryAreaCountService,

        private readonly itemService: InventoryItemService,
    ){ super(itemCountRepo, 'InventoryAreaItemService'); }

    /**
     * - InventoryItemSize property can be either created or a pre-existing entity on this create call.
     * - If InventoryItemSize is new, a new itemSize is created at the controller level, and its ID is assigned to
     *   the DTO and passed to this method.
     * - Requires the parent inventoryAreaCount and InventoryArea entities to already exist
     */
    async create(dto: CreateInventoryAreaItemDto): Promise<InventoryAreaItem | null> {
        const parentInventoryCount = await this.countService.findOne(dto.areaCountId as number)
        if(!parentInventoryCount){ throw new NotFoundException(); }
        
        const countedItem = await this.itemCountBuilder.buildCreateDto(parentInventoryCount, dto);
        return this.itemCountRepo.save(countedItem);
    }

    /**
     * Uses Repository.Save(), NOT Update()
     * - If the inventoryItem changes, the itemSize must also change.
     * Updating an itemCount could contain a new InventoryItemSize entity, if so, a new size is created at controller level and its
     * Id is assigned to this DTO before being passed to this method.
     */
    async update(id: number, dto: UpdateInventoryAreaItemDto): Promise< InventoryAreaItem | null> {
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

    async findByAreaName(name: string, relations?: Array<keyof InventoryAreaItem>): Promise<InventoryAreaItem[]> {
        const area = await this.inventoryAreaService.findOneByName(name);
        if(!area){ throw new Error('inventory area not found'); }

        return await this.itemCountRepo.find({ 
            where: { inventoryArea: { name: name } }, 
            relations
        });
    }

    async findByItemName(name: string, relations?: Array<keyof InventoryAreaItem>): Promise<InventoryAreaItem[]> {
        const item = await this.itemService.findOneByName(name);
        if(!item){ throw new Error('inventory item not found'); }

        return await this.itemCountRepo.find({ 
            where: { item: { id: item.id } }, 
            relations
        });
    }
}