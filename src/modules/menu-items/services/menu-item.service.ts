import { Injectable, NotImplementedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { CreateMenuItemDto } from "../dto/create-menu-item.dto";
import { UpdateMenuItemDto } from "../dto/update-menu-item.dto";
import { MenuItem } from "../entities/menu-item.entity";

@Injectable()
export class MenuItemService extends ServiceBase<MenuItem> {
    constructor(
        @InjectRepository(MenuItem)
        private readonly itemRepo: Repository<MenuItem>,
    ){ super(itemRepo); }

    async create(dto: CreateMenuItemDto): Promise<MenuItem | null> {
        throw new NotImplementedException();
    }

    async update(id: number, dto: UpdateMenuItemDto): Promise<MenuItem | null> {
        throw new NotImplementedException();
    }
}