import { Injectable, NotImplementedException } from "@nestjs/common";
import { MenuItemSize } from "../entities/menu-item-size.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { CreateMenuItemSizeDto } from "../dto/create-menu-item-size.dto";
import { UpdateMenuItemSizeDto } from "../dto/update-menu-item-size.dto";

@Injectable()
export class MenuItemSizeService extends ServiceBase<MenuItemSize> {
    constructor(
        @InjectRepository(MenuItemSize)
        private readonly sizeRepo: Repository<MenuItemSize>,
    ){ super(sizeRepo); }

    async create(dto: CreateMenuItemSizeDto): Promise<MenuItemSize | null> {
        throw new NotImplementedException();
    }

    async update(id: number, dto: UpdateMenuItemSizeDto): Promise<MenuItemSize | null> {
        throw new NotImplementedException();
    }
}