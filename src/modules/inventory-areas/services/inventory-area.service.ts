import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { InventoryAreaBuilder } from "../builders/inventory-area.builder";
import { CreateInventoryAreaDto } from "../dto/create-inventory-area.dto";
import { UpdateInventoryAreaDto } from "../dto/update-inventory-area.dto";
import { InventoryArea } from "../entities/inventory-area.entity";
import { forwardRef, Inject } from "@nestjs/common";
import { InventoryAreaValidator } from "../validators/inventory-area.validator";

export class InventoryAreaService extends ServiceBase<InventoryArea> {
    constructor(
        @InjectRepository(InventoryArea)
        private readonly areaRepo: Repository<InventoryArea>,
        
        @Inject(forwardRef(() => InventoryAreaBuilder))
        private readonly areaBuilder: InventoryAreaBuilder,

        validator: InventoryAreaValidator,
        
    ) { super(areaRepo, areaBuilder, validator, 'InventoryAreaService'); }
    /*
    async create(createDto: CreateInventoryAreaDto): Promise<InventoryArea | null> {
        const exists = await this.findOneByName(createDto.name);
        if(exists) { return null; }

        const area = await this.areaBuilder.buildCreateDto(createDto);
        return await this.areaRepo.save(area);
    }*/
 
    /**
    * Uses Repository.Save(), not Repository.Update()
    */
    async update(id: number, updateDto: UpdateInventoryAreaDto): Promise<InventoryArea | null> {
        const toUpdate = await this.findOne(id);
        if(!toUpdate){ return null; }
        
        await this.areaBuilder.buildUpdateDto(toUpdate, updateDto);
        return await this.areaRepo.save(toUpdate);
    }

    async findOneByName(name: string, relations?: Array<keyof InventoryArea>): Promise<InventoryArea | null> {
        return await this.areaRepo.findOne({ where: { name }, relations}); 
    }
}