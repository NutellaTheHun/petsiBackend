import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { MenuItemCategoryBuilder } from "../builders/menu-item-category.builder";
import { MenuItemCategory } from "../entities/menu-item-category.entity";
import { MenuItemCategoryValidator } from "../validators/menu-item-category.validator";

@Injectable()
export class MenuItemCategoryService extends ServiceBase<MenuItemCategory> {
    constructor(
        @InjectRepository(MenuItemCategory)
        private readonly categoryRepo: Repository<MenuItemCategory>,
        categoryBuilder: MenuItemCategoryBuilder,
        validator: MenuItemCategoryValidator,
    ){ super(categoryRepo, categoryBuilder, validator, 'MenuItemCategoryService'); }

    async findOneByName(name: string, relations?: Array<keyof MenuItemCategory>): Promise<MenuItemCategory | null> {
        return await this.categoryRepo.findOne({ where: { name: name }, relations: relations });
    }
}