import { InjectRepository } from "@nestjs/typeorm";
import { MenuItemCategory } from "../entities/menu-item-category.entity";
import { ServiceBase } from "../../../base/service-base";
import { Injectable, NotImplementedException } from "@nestjs/common";
import { Repository } from "typeorm";
import { CreateMenuItemCategoryDto } from "../dto/create-menu-item-category.dto";
import { UpdateMenuItemCategoryDto } from "../dto/update-menu-item-category.dto";

@Injectable()
export class MenuItemCategoryService extends ServiceBase<MenuItemCategory> {
    constructor(
        @InjectRepository(MenuItemCategory)
        private readonly categoryRepo: Repository<MenuItemCategory>,
    ){ super(categoryRepo); }

    async create(dto: CreateMenuItemCategoryDto): Promise<MenuItemCategory | null> {
        throw new NotImplementedException();
    }

    async update(id: number, dto: UpdateMenuItemCategoryDto): Promise<MenuItemCategory | null> {
        throw new NotImplementedException();
    }

    async findOneByName(name: string, relations?: Array<keyof MenuItemCategory>): Promise<MenuItemCategory | null> {
            return await this.categoryRepo.findOne({ where: { name: name }, relations: relations });
    }
}