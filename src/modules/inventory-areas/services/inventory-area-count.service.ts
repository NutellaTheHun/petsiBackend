import { forwardRef, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { CreateInventoryAreaCountDto } from "../dto/create-inventory-area-count.dto";
import { UpdateInventoryAreaCountDto } from "../dto/update-inventory-area-count.dto";
import { InventoryAreaCount } from "../entities/inventory-area-count.entity";
import { InventoryAreaCountFactory } from "../factories/inventory-area-count.factory";
import { InventoryAreaItemCountService } from "./inventory-area-item-count.service";
import { InventoryAreaService } from "./inventory-area.service";
import { AREA_A, AREA_B } from "../utils/constants";

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

        const area = await this.areaService.findOne(createDto.inventoryAreaId);
        if(!area){ throw new Error('inventory area not found'); }

        const count = this.areaCountFactory.createEntityInstance({
            inventoryArea: area,
        })
        
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

    async findByAreaName(name: string, relations?: string[]): Promise<InventoryAreaCount[]> {
        const area = await this.areaService.findOneByName(name);
        if(!area){ throw new Error('inventory area not found'); }
        
        return await this.areaCountRepo.find({ 
            where: { inventoryArea: { id: area.id } }, 
            relations
        });
    }

    /**
     * finds all counts for the given day of date, ignores time.
     */
    async findByDate(date: Date, relations?: string[]): Promise<InventoryAreaCount[]> {
        const startOfDay = new Date(date);
        startOfDay.setUTCHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setUTCHours(23, 59, 59, 999);

        return await this.areaCountRepo.find({
            where: {
                countDate: Between(startOfDay, endOfDay),
            },
            relations,
        });
    }

    async initializeTestingDatabase(): Promise<InventoryAreaCount[]> {
        const results: InventoryAreaCount[] = []
        const inventoryArea_A = await this.areaService.findOneByName(AREA_A);
        const areaCountDTO_A = this.areaCountFactory.createDtoInstance({ inventoryAreaId: inventoryArea_A?.id });

        const result_A = await this.create(areaCountDTO_A);
        if(!result_A){ throw new Error('failed to create test inventory count'); }
        results.push(result_A);

        const inventoryArea_B = await this.areaService.findOneByName(AREA_B);
        const areaCountDTO_B = this.areaCountFactory.createDtoInstance({ inventoryAreaId: inventoryArea_B?.id });

        const result_B = await this.create(areaCountDTO_B);
        if(!result_B){ throw new Error('failed to create test inventory count'); }
        results.push(result_B);
        
        return results;
    }
}