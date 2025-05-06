import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { MenuItemBuilder } from "../builders/menu-item.builder";
import { MenuItem } from "../entities/menu-item.entity";
import { MenuItemValidator } from "../validators/menu-item.validator";

@Injectable()
export class MenuItemService extends ServiceBase<MenuItem> {
    constructor(
        @InjectRepository(MenuItem)
        private readonly itemRepo: Repository<MenuItem>,
        itemBuilder: MenuItemBuilder,
        validator: MenuItemValidator,
    ){ super(itemRepo, itemBuilder, validator, 'MenuItemService'); }

    async findOneByName(name: string, relations?: Array<keyof MenuItem>): Promise<MenuItem | null> {
        return await this.itemRepo.findOne({ where: { name: name }, relations: relations });
    }
}