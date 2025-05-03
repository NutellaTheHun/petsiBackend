import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { MenuItemCategoryBuilder } from "../builders/menu-item-category.builder";
import { CreateMenuItemCategoryDto } from "../dto/create-menu-item-category.dto";
import { UpdateMenuItemCategoryDto } from "../dto/update-menu-item-category.dto";
import { MenuItemCategory } from "../entities/menu-item-category.entity";

@Injectable()
export class MenuItemCategoryService extends ServiceBase<MenuItemCategory> {
    constructor(
        @InjectRepository(MenuItemCategory)
        private readonly categoryRepo: Repository<MenuItemCategory>,
        private readonly categoryBuilder: MenuItemCategoryBuilder,
    ){ super(categoryRepo, 'MenuItemCategoryService'); }

    async create(dto: CreateMenuItemCategoryDto): Promise<MenuItemCategory | null> {
        const exists = await this.findOneByName(dto.name);
        if(exists){ return null; }

        const category = await this.categoryBuilder.buildCreateDto(dto);
        return await this.categoryRepo.save(category);
    }

    async update(id: number, dto: UpdateMenuItemCategoryDto): Promise<MenuItemCategory | null> {
        const toUpdate = await this.findOne(id);
        if(!toUpdate) { return null; }

        await this.categoryBuilder.buildUpdateDto(toUpdate, dto);
        return await this.categoryRepo.save(toUpdate);
    }

    async findOneByName(name: string, relations?: Array<keyof MenuItemCategory>): Promise<MenuItemCategory | null> {
        return await this.categoryRepo.findOne({ where: { name: name }, relations: relations });
    }
}