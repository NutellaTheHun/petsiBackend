import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { MenuItemBuilder } from "../builders/menu-item.builder";
import { CreateMenuItemDto } from "../dto/create-menu-item.dto";
import { UpdateMenuItemDto } from "../dto/update-menu-item.dto";
import { MenuItem } from "../entities/menu-item.entity";
import { MenuItemValidator } from "../validators/menu-item.validator";

@Injectable()
export class MenuItemService extends ServiceBase<MenuItem> {
    constructor(
        @InjectRepository(MenuItem)
        private readonly itemRepo: Repository<MenuItem>,
        private readonly itemBuilder: MenuItemBuilder,
        validator: MenuItemValidator,
    ){ super(itemRepo, itemBuilder, validator, 'MenuItemService'); }

    async create(dto: CreateMenuItemDto): Promise<MenuItem | null> {
        const exist = await this.findOneByName(dto.name);
        if(exist){ return null; }

        const item = await this.itemBuilder.buildCreateDto(dto);
        return await this.itemRepo.save(item);
    }

    async update(id: number, dto: UpdateMenuItemDto): Promise<MenuItem | null> {
        const toUpdate = await this.findOne(id);
        if(!toUpdate){ return null; }

        await this.itemBuilder.buildUpdateDto(toUpdate, dto);
        
        return await this.itemRepo.save(toUpdate);
    }

    async findOneByName(name: string, relations?: Array<keyof MenuItem>): Promise<MenuItem | null> {
        return await this.itemRepo.findOne({ where: { name: name }, relations: relations });
    }
}