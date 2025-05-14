import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { RequestContextService } from "../../request-context/RequestContextService";
import { AppLogger } from "../../app-logging/app-logger";
import { MenuItemCategoryBuilder } from "../builders/menu-item-category.builder";
import { MenuItemCategory } from "../entities/menu-item-category.entity";
import { MenuItemCategoryValidator } from "../validators/menu-item-category.validator";

@Injectable()
export class MenuItemCategoryService extends ServiceBase<MenuItemCategory> {
    constructor(
        @InjectRepository(MenuItemCategory)
        private readonly categoryRepo: Repository<MenuItemCategory>,

        @Inject(forwardRef(() => MenuItemCategoryBuilder))
        categoryBuilder: MenuItemCategoryBuilder,

        validator: MenuItemCategoryValidator,

        requestContextService: RequestContextService,

        logger: AppLogger,
    ){ super(categoryRepo, categoryBuilder, validator, 'MenuItemCategoryService', requestContextService, logger); }

    async findOneByName(name: string, relations?: Array<keyof MenuItemCategory>): Promise<MenuItemCategory | null> {
        return await this.categoryRepo.findOne({ where: { name: name }, relations: relations });
    }
}