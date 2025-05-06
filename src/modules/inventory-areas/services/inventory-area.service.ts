import { forwardRef, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { InventoryAreaBuilder } from "../builders/inventory-area.builder";
import { InventoryArea } from "../entities/inventory-area.entity";
import { InventoryAreaValidator } from "../validators/inventory-area.validator";

export class InventoryAreaService extends ServiceBase<InventoryArea> {
    constructor(
        @InjectRepository(InventoryArea)
        private readonly areaRepo: Repository<InventoryArea>,
        
        @Inject(forwardRef(() => InventoryAreaBuilder))
        areaBuilder: InventoryAreaBuilder,

        validator: InventoryAreaValidator,
        
    ) { super(areaRepo, areaBuilder, validator, 'InventoryAreaService'); }

    async findOneByName(name: string, relations?: Array<keyof InventoryArea>): Promise<InventoryArea | null> {
        return await this.areaRepo.findOne({ where: { name }, relations}); 
    }
}