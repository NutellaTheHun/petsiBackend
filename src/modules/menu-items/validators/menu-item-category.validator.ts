import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { MenuItemCategory } from "../entities/menu-item-category.entity";
import { CreateMenuItemCategoryDto } from "../dto/menu-item-category/create-menu-item-category.dto";
import { UpdateMenuItemCategoryDto } from "../dto/menu-item-category/update-menu-item-category.dto";

@Injectable()
export class MenuItemCategoryValidator extends ValidatorBase<MenuItemCategory> {
    constructor(
        @InjectRepository(MenuItemCategory)
        private readonly repo: Repository<MenuItemCategory>,
    ){ super(repo); }

    public async validateCreate(dto: CreateMenuItemCategoryDto): Promise<string | null> {
        const exists = await this.repo.findOne({ where: { categoryName: dto.categoryName }});
        if(exists) { 
            return `Menu item category with name ${dto.categoryName} already exists`; 
        }
        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateMenuItemCategoryDto): Promise<string | null> {
        return null;
    }
}