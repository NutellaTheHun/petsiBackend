import { forwardRef, Inject, NotImplementedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { InventoryItemSize } from "../../inventory-items/entities/inventory-item-size.entity";
import { InventoryItemSizeService } from "../../inventory-items/services/inventory-item-size.service";
import { InventoryItemService } from "../../inventory-items/services/inventory-item.service";
import { CreateInventoryAreaItemCountDto } from "../dto/create-inventory-area-item-count.dto";
import { UpdateInventoryAreaItemCountDto } from "../dto/update-inventory-area-item-count.dto";
import { InventoryAreaItemCount } from "../entities/inventory-area-item-count.entity";
import { InventoryAreaItemCountFactory } from "../factories/inventory-area-item-count.factory";
import { InventoryAreaCountService } from "./inventory-area-count.service";
import { InventoryAreaService } from "./inventory-area.service";

export class InventoryAreaItemCountService extends ServiceBase<InventoryAreaItemCount> {
    constructor(
        @InjectRepository(InventoryAreaItemCount)
        private readonly itemCountRepo: Repository<InventoryAreaItemCount>,

        @Inject(forwardRef(() => InventoryAreaCountService))
        private readonly areaCountService: InventoryAreaCountService,

        private readonly inventoryAreaService: InventoryAreaService,
        private readonly itemService: InventoryItemService,
        private readonly itemSizeService: InventoryItemSizeService,

        private readonly itemCountFactory: InventoryAreaItemCountFactory
    ){ super(itemCountRepo); }

    /**
     * - This createDTO has an optional ItemSizeID or a createItemSizeDto, handles if the counted item is
     *   using a pre-existing itemSize, or create a new one at function call.
     * 
     * - MEANING a createDTO should contain either a ItemSizeCreateDTO and ItemSizeId of 0, 
     *   OR a null/undefined ItemSizeCreateDTO and a non-Zero itemSize id.
     * 
     * - is called during the AreaCountService.Create() method, (when an areaCount is being created, the areaCount
     *   create DTO holds a list of child inventoryAreaItemCountDTOs to be created during the AreaCount create call)
     * 
     * - MEANING the parent AreaCount MUST already be inserted into the database.
     */
    async create(dto: CreateInventoryAreaItemCountDto): Promise<InventoryAreaItemCount | null> {
        if(dto.itemSizeId !== 0 && dto.itemSizeCreateDto){ 
            throw new Error('create item count DTO has a populated itemSizeId and createitemSizeDto');
        }
        if((!dto.itemSizeId || dto.itemSizeId === 0) && !dto.itemSizeCreateDto){
            throw new Error('create item doesnt has any itemSize information');
        }
        /**
         * An item size can either be a prexisting entity, or created during the inventory count
         * So if it already exists, the DTO will have the itemSize id, otherwise passes 0,
         * signaling that a new item size is being created for this item count.
         */
        let itemSize: InventoryItemSize;
        if(dto.itemSizeId !== 0){
            const existingItemSize = await this.itemSizeService.findOne(dto.itemSizeId);
            if(!existingItemSize){ throw new Error("item size not found"); }
            itemSize = existingItemSize;
        }
        else { 
            const newItemSize = await this.itemSizeService.create(dto.itemSizeCreateDto);
            if(!newItemSize){ throw new Error('new item size failed tocreate'); }
            itemSize = newItemSize;
        }

        const countedItem = this.itemCountFactory.createEntityInstance({
            inventoryArea: await this.inventoryAreaService.findOne(dto.inventoryAreaId),
            areaCount: await this.areaCountService.findOne(dto.areaCountId),
            item: await this.itemService.findOne(dto.inventoryItemId),
            unitAmount: dto.unitAmount || 1,
            measureAmount: dto.measureAmount,
            size: itemSize
        })
        return this.itemCountRepo.save(countedItem);
    }

    /**
     * Uses Repository.Save(), NOT Update()
     * updateDto cannot have both a itemSizeId to update, and a createItemSizeDto to create.
     */
    async update(id: number, dto: UpdateInventoryAreaItemCountDto): Promise< InventoryAreaItemCount | null> {
        if(dto.inventoryItemId && dto.itemSizeCreateDto){
            throw new Error('updateDto cannot have both an ItemSizeId to update, and a createItemSizeDto to create');
        }
        const toUpdate = await this.findOne(id);
        if(!toUpdate){ throw new Error('counted item to update not found'); }
        
        if(dto.inventoryAreaId){
            const newArea = await this.inventoryAreaService.findOne(dto.inventoryAreaId);
            if(!newArea){ throw new Error('new area for updated counted item not found'); }
            toUpdate.inventoryArea = newArea;
        }
        
        if(dto.areaCountId){
            const newAreaCount = await this.areaCountService.findOne(dto.areaCountId);
            if(!newAreaCount){ throw new Error('new area for updated counted item not found'); }
            toUpdate.areaCount = newAreaCount;
        }
        
        // if the inventoryItem is changing, the itemSize must change as well
        if(dto.inventoryItemId){
            if(!dto.itemSizeId && !dto.itemSizeCreateDto){ throw new Error('updated itemCount attempt to change item without new item size'); }
            
            const newItem = await this.itemService.findOne(dto.inventoryItemId);
            if(!newItem){ throw new Error('new item for itemCount update not found'); }

            toUpdate.item = newItem;
        }
        if(dto.itemSizeId){
            const newSize =  await this.itemSizeService.findOne(dto.itemSizeId);
            if(!newSize){ throw new Error("item size not found"); }
            toUpdate.size = newSize;
        }
        if(dto.itemSizeCreateDto){
            const newItemSize = await this.itemSizeService.create(dto.itemSizeCreateDto);
            if(!newItemSize){ throw new Error('new item size failed tocreate'); }
            toUpdate.size = newItemSize;
        }
        
        if(dto.unitAmount){
            toUpdate.unitAmount = dto.unitAmount;
        }
        
        if(dto.measureAmount){
            toUpdate.measureAmount = dto.measureAmount;
        }
        
        return await this.itemCountRepo.save(toUpdate);
    }

    async findByArea(areaName: string, relations?: string[]): Promise<InventoryAreaItemCount[]> {
        const area = await this.inventoryAreaService.findOneByName(areaName);
        if(!area){ throw new Error('inventory area not found'); }

        return await this.itemCountRepo.find({ 
            where: { inventoryArea: { id: area.id } }, 
            relations
        });
    }

    async findByItem(itemName: string, relations?: string[]): Promise<InventoryAreaItemCount[]> {
        const item = await this.itemService.findOneByName(itemName);
        if(!item){ throw new Error('inventory item not found'); }

        return await this.itemCountRepo.find({ 
            where: { item: { id: item.id } }, 
            relations
        });
    }
}