import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { MenuItemCategoryBuilder } from "../builders/menu-item-category.builder";
import { MenuItemCategory } from "../entities/menu-item-category.entity";

@Injectable()
export class MenuItemCategoryService extends ServiceBase<MenuItemCategory> {
    constructor(
        @InjectRepository(MenuItemCategory)
        private readonly repo: Repository<MenuItemCategory>,

        @Inject(forwardRef(() => MenuItemCategoryBuilder))
        builder: MenuItemCategoryBuilder,

        requestContextService: RequestContextService,
        logger: AppLogger,
    ) { super(repo, builder, 'MenuItemCategoryService', requestContextService, logger); }

    async findOneByName(name: string, relations?: Array<keyof MenuItemCategory>): Promise<MenuItemCategory | null> {
        return await this.repo.findOne({ where: { categoryName: name }, relations: relations });
    }

    protected applySortBy(query: SelectQueryBuilder<MenuItemCategory>, sortBy: string, sortOrder: "ASC" | "DESC"): void {
        if (sortBy === 'categoryName') {
            query.orderBy(`entity.${sortBy}`, sortOrder);
        }
    }
}