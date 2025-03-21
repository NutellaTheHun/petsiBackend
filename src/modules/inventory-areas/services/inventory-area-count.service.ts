import { forwardRef, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { CreateInventoryAreaCountDto } from "../dto/create-inventory-area-count.dto";
import { UpdateInventoryAreaCountDto } from "../dto/update-inventory-area-count.dto";
import { InventoryAreaCount } from "../entities/inventory-area-count.entity";
import { InventoryAreaItemCount } from "../entities/inventory-area-item-count.entity";
import { InventoryAreaCountFactory } from "../factories/inventory-area-count.factory";
import { InventoryAreaItemCountService } from "./inventory-area-item-count.service";
import { InventoryAreaService } from "./inventory-area.service";

/**
 * Intended flow of facilitating an inventory count:
 * - select pre-existing inventory area
 * - Create InventoryAreaCount with an InvArea, and empty list of inventoryItemCount
 * - employee performs inventory count, creating list of inventoryItemCount
 * - employee saves/completes/finished inventory count, updateDTO is sent with areaId, countId, and inventoryItemCountDTOs
 * - inventoryItemCountDTOs are created (via separate call to inventoryItemCountController)
 * - with returned list of inventoryItemCountIDs, update areaCount entity with itemIDs
 */
export class InventoryAreaCountService extends ServiceBase<InventoryAreaCount> {
    constructor(
        @InjectRepository(InventoryAreaCount)
        private readonly areaCountRepo: Repository<InventoryAreaCount>,

        private readonly areaCountFactory: InventoryAreaCountFactory,

        @Inject(forwardRef(() => InventoryAreaService))
        private readonly areaService: InventoryAreaService,

        @Inject(forwardRef(() => InventoryAreaItemCountService))
        private readonly areaItemService: InventoryAreaItemCountService,
    ){ super(areaCountRepo); }

    /**
     * Creates an InventoryCount, required prexisting AreaId present, is created before inventoryItemCounts are
     * created/assigned. InventoryItemCounts are assigned in a following update call.
     */
    async create(createDto: CreateInventoryAreaCountDto): Promise<InventoryAreaCount | null> {
        if(!createDto.inventoryAreaId){ throw new Error('Inventory Count must have an inventory area id'); }
        if(createDto.inventoryItemCountIds){ throw new Error('InventoryCountIds present in create call, must only be present in update') }

        // how does inventoryArea get updated with a new count?
        const area = await this.areaService.findOne(createDto.inventoryAreaId);
        if(!area){ throw new Error('inventory area not found'); }

        const count = this.areaCountFactory.createEntityInstance({
            inventoryArea: area,
        })

        //Updates area's inventory Count with new count.
        area.inventoryCounts.push(count);
        await this.areaService.update(area.id, area);

        /*await this.areaCountRepo.save(count);
        
        if(createDto.inventoryItemCountIds){
            const countedItems = await this.areaItemService.findEntitiesById(createDto.inventoryItemCountIds);
            count.items = countedItems;
        }*/
        
        return await this.areaCountRepo.save(count);
    }

    /**
     * Uses Repository.Save(), NOT UPDATE()
     */
    async update(id: number, updateDto: UpdateInventoryAreaCountDto): Promise< InventoryAreaCount | null> {
        const toUpdate = await this.findOne(id);
        if(!toUpdate){ return null; }

        if(updateDto.inventoryAreaId){
            const newArea = await this.areaService.findOne(updateDto.inventoryAreaId);
            if(!newArea){ throw new Error('inventory area to update not found'); }
            toUpdate.inventoryArea = newArea;
        }

        if(updateDto.inventoryItemCountIds){
            const countedItems = await this.areaItemService.findEntitiesById(updateDto.inventoryItemCountIds);
            toUpdate.items = countedItems;
        }

        return await this.areaCountRepo.save(toUpdate);
    }

    async findByArea(areaName: string, relations?: string[]): Promise<InventoryAreaCount[]> {
        const area = await this.areaService.findOneByName(areaName);
        if(!area){ throw new Error('inventory area not found'); }
        
        return await this.areaCountRepo.find({ 
            where: { inventoryArea: { id: area.id } }, 
            relations
        });
    }

    async findByDate(date: Date, relations?: string[]): Promise<InventoryAreaCount[]> {
        return await this.areaCountRepo.find({ where: { countDate: date }, relations });
    }
}