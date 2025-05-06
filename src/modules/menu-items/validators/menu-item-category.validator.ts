import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { MenuItemCategory } from "../entities/menu-item-category.entity";

@Injectable()
export class MenuItemCategoryValidator extends ValidatorBase<MenuItemCategory> {
    constructor(
        @InjectRepository(MenuItemCategory)
        private readonly repo: Repository<MenuItemCategory>,
    ){ super(repo); }

    public async validateCreate(dto: any): Promise<string | null> {
        return null;
    }
    public async validateUpdate(dto: any): Promise<string | null> {
        return null;
    }
}