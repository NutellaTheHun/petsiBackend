import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { MenuItemSizeBuilder } from "../builders/menu-item-size.builder";
import { MenuItemSize } from "../entities/menu-item-size.entity";

@Injectable()
export class MenuItemSizeService extends ServiceBase<MenuItemSize> {
    constructor(
        @InjectRepository(MenuItemSize)
        private readonly repo: Repository<MenuItemSize>,

        builder: MenuItemSizeBuilder,
        
        requestContextService: RequestContextService,
        logger: AppLogger,
    ) { super(repo, builder, 'MenuItemSizeService', requestContextService, logger); }

    async findOneByName(name: string, relations?: Array<keyof MenuItemSize>): Promise<MenuItemSize | null> {
        return await this.repo.findOne({ where: { name: name }, relations });
    }
}