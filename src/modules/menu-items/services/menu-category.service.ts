import { InjectRepository } from "@nestjs/typeorm";
import { MenuCategory } from "../entities/menu-category.entity";
import { ServiceBase } from "../../../base/service-base";
import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";

@Injectable()
export class MenuCategoryService extends ServiceBase<MenuCategory> {
    constructor(
        @InjectRepository(MenuCategory)
        private readonly categoryRepo: Repository<MenuCategory>,
    ){ super(categoryRepo); }
}