import { forwardRef, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { InventoryAreaBuilder } from "../builders/inventory-area.builder";
import { InventoryArea } from "../entities/inventory-area.entity";

export class InventoryAreaService extends ServiceBase<InventoryArea> {
    constructor(
        @InjectRepository(InventoryArea)
        private readonly repo: Repository<InventoryArea>,

        @Inject(forwardRef(() => InventoryAreaBuilder))
        builder: InventoryAreaBuilder,

        requestContextService: RequestContextService,
        logger: AppLogger,
    ) { super(repo, builder, 'InventoryAreaService', requestContextService, logger); }

    async findOneByName(name: string, relations?: Array<keyof InventoryArea>): Promise<InventoryArea | null> {
        return await this.repo.findOne({ where: { areaName: name }, relations });
    }
}