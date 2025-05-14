import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { RequestContextService } from "../../request-context/RequestContextService";
import { AppLogger } from "../../app-logging/app-logger";
import { MenuItemSizeBuilder } from "../builders/menu-item-size.builder";
import { MenuItemSize } from "../entities/menu-item-size.entity";
import { MenuItemSizeValidator } from "../validators/menu-item-size.validator";

@Injectable()
export class MenuItemSizeService extends ServiceBase<MenuItemSize> {
    constructor(
        @InjectRepository(MenuItemSize)
        private readonly sizeRepo: Repository<MenuItemSize>,

        sizeBuilder: MenuItemSizeBuilder,

        validator: MenuItemSizeValidator,

        requestContextService: RequestContextService,
        
        logger: AppLogger,
    ){ super(sizeRepo, sizeBuilder, validator, 'MenuItemSizeService', requestContextService, logger); }

    async findOneByName(name: string, relations?: Array<keyof MenuItemSize>): Promise<MenuItemSize | null> {
        return await this.sizeRepo.findOne({ where: { name: name }, relations });
    }
}