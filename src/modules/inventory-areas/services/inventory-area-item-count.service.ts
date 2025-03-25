import { forwardRef, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
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

        @Inject(forwardRef(() => InventoryItemService))
        private readonly itemService: InventoryItemService,

        @Inject(forwardRef(() => InventoryItemSizeService))
        private readonly itemSizeService: InventoryItemSizeService,

        private readonly itemCountFactory: InventoryAreaItemCountFactory
    ){ super(itemCountRepo); }

    /**
     * - InventoryItemSize property can be either created or a pre-existing entity on this create call.
     * - If InventoryItemSize is new, a new itemSize is created at the controller level, and its ID is assigned to
     *   the DTO and passed to this method.
     * - Requires the parent inventoryAreaCount and InventoryArea entities to already exist
     */
    async create(dto: CreateInventoryAreaItemCountDto): Promise<InventoryAreaItemCount | null> {

        const item = await this.itemService.findOne(dto.inventoryItemId);
        if(!item){ throw new Error('inventoryItem is null'); }

        const size = await this.itemSizeService.findOne(dto.itemSizeId);
        if(!size){ throw new Error('InventoryItemSize is null'); }

        const count = await this.areaCountService.findOne(dto.areaCountId);
        if(!count){ throw new Error('inventoryCount is null'); }

        const area = await this.inventoryAreaService.findOne(dto.inventoryAreaId);
        if(!area){ throw new Error('inventoryArea is null'); }

        const countedItem = this.itemCountFactory.createEntityInstance({
            inventoryArea: area,
            areaCount: count,
            item: item,
            unitAmount: dto.unitAmount || 1,
            measureAmount: dto.measureAmount,
            size: size
        });

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
        
        if(dto.inventoryItemId){   
            const newItem = await this.itemService.findOne(dto.inventoryItemId);
            if(!newItem){ throw new Error('new item for itemCount update not found'); }

            toUpdate.item = newItem;
        }
        if(dto.itemSizeId){
            const newSize =  await this.itemSizeService.findOne(dto.itemSizeId);
            if(!newSize){ throw new Error("item size not found"); }
            toUpdate.size = newSize;
        }
        
        if(dto.unitAmount){
            toUpdate.unitAmount = dto.unitAmount;
        }
        
        if(dto.measureAmount){
            toUpdate.measureAmount = dto.measureAmount;
        }
        
        return await this.itemCountRepo.save(toUpdate);
    }

    async findByAreaName(name: string, relations?: string[]): Promise<InventoryAreaItemCount[]> {
        const area = await this.inventoryAreaService.findOneByName(name);
        if(!area){ throw new Error('inventory area not found'); }

        return await this.itemCountRepo.find({ 
            where: { inventoryArea: { id: area.id } }, 
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