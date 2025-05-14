import { forwardRef, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { RequestContextService } from "../../request-context/RequestContextService";
import { AppLogger } from "../../app-logging/app-logger";
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
        requestContextService: RequestContextService,
        logger: AppLogger,
    ) { super(areaRepo, areaBuilder, validator, 'InventoryAreaService', requestContextService, logger); }

    async findOneByName(name: string, relations?: Array<keyof InventoryArea>): Promise<InventoryArea | null> {
        return await this.areaRepo.findOne({ where: { name }, relations}); 
    }
}