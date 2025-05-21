import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { RequestContextService } from "../../request-context/RequestContextService";
import { AppLogger } from "../../app-logging/app-logger";
import { MenuItemBuilder } from "../builders/menu-item.builder";
import { MenuItem } from "../entities/menu-item.entity";
import { MenuItemValidator } from "../validators/menu-item.validator";

@Injectable()
export class MenuItemService extends ServiceBase<MenuItem> {
    constructor(
        @InjectRepository(MenuItem)
        private readonly itemRepo: Repository<MenuItem>,

        @Inject(forwardRef(() => MenuItemBuilder))
        itemBuilder: MenuItemBuilder,

        @Inject(forwardRef(() => MenuItemValidator))
        validator: MenuItemValidator,

        requestContextService: RequestContextService,

        logger: AppLogger,
    ){ super(itemRepo, itemBuilder, validator, 'MenuItemService', requestContextService, logger); }

    async findOneByName(name: string, relations?: Array<keyof MenuItem>): Promise<MenuItem | null> {
        return await this.itemRepo.findOne({ where: { itemName: name }, relations: relations });
    }
}