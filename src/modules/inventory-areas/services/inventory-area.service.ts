import { forwardRef, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { CreateInventoryAreaDto } from "../dto/create-inventory-area.dto";
import { UpdateInventoryAreaDto } from "../dto/update-inventory-area.dto";
import { InventoryArea } from "../entities/inventory-area.entity";
import { InventoryAreaFactory } from "../factories/inventory-area.factory";
import { InventoryAreaCountService } from "./inventory-area-count.service";

export class InventoryAreaService extends ServiceBase<InventoryArea> {
    constructor(
        @InjectRepository(InventoryArea)
        private readonly areaRepo: Repository<InventoryArea>,

        @Inject(forwardRef(() => InventoryAreaService))
        private readonly countService: InventoryAreaCountService,

        private readonly areaFactory: InventoryAreaFactory,
    ) { super(areaRepo); }

    async create(createDto: CreateInventoryAreaDto): Promise<InventoryArea | null> {
        const exists = await this.findOneByName(createDto.name);
        if(exists) { return null; }

        const area = this.areaFactory.createEntityInstance({
            name: createDto.name,
            inventoryCounts: await this.countService.findEntitiesById(createDto.inventoryCountIds),
        });

        return await this.areaRepo.save(area);
    }
    
    /**
    * Uses Repository.Save(), NOT UPDATE
    */
    async update(id: number, updateDto: UpdateInventoryAreaDto): Promise< InventoryArea | null> {
        const toUpdate = await this.findOne(id);
        if(!toUpdate){ return null; }

        if(updateDto.name){
            toUpdate.name = updateDto.name;
        }

        if(updateDto.inventoryCountIds){
            toUpdate.inventoryCounts = await this.countService.findEntitiesById(updateDto.inventoryCountIds);
        }

        return await this.areaRepo.save(toUpdate);
    }

    async findOneByName(name: string, relations?: string[]): Promise<InventoryArea | null> {
        return await this.areaRepo.findOne({ where: { name }, relations}); 
    }
}