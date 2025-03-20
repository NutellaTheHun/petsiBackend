import { forwardRef, Inject, NotImplementedException } from "@nestjs/common";
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

    async create(createDto: CreateInventoryAreaCountDto): Promise<InventoryAreaCount | null> {

        const count = this.areaCountFactory.createEntityInstance({
            inventoryArea: await this.areaService.findOne(createDto.inventoryAreaId),
            countDate: new Date(),
        })
        await this.areaCountRepo.save(count);

        if(createDto.itemCountCreateDto){
            const countedItems: InventoryAreaItemCount[] = [];
            for(const dto of createDto.itemCountCreateDto){
                const countedItem = await this.areaItemService.create(dto);
                if(!countedItem){ throw new Error('creation of inventoryAreaItemCount failed'); }

                countedItems.push(countedItem);
            }

            count.items = countedItems;
        }
        
        /*
        const count = this.areaCountFactory.createEntityInstance({
            inventoryArea: await this.areaService.findOne(createDto.inventoryAreaId),
            countDate: new Date(),
            items: countedItems,
        })
        */
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

        if(updateDto.itemCountCreateDto){
            const countedItems: InventoryAreaItemCount[] = [];
            for(const dto of updateDto.itemCountCreateDto){
                const countedItem = await this.areaItemService.create(dto);
                if(countedItem){ countedItems.push(countedItem); }
                else { throw new Error('error occured creating inventoryAreaItemCount')}
            }

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
        return await this.areaCountRepo.find({ where: { countDate: date }, relations});
    }
}