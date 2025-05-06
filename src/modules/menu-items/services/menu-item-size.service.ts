import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { MenuItemSizeBuilder } from "../builders/menu-item-size.builder";
import { CreateMenuItemSizeDto } from "../dto/create-menu-item-size.dto";
import { UpdateMenuItemSizeDto } from "../dto/update-menu-item-size.dto";
import { MenuItemSize } from "../entities/menu-item-size.entity";
import { MenuItemSizeValidator } from "../validators/menu-item-size.validator";

@Injectable()
export class MenuItemSizeService extends ServiceBase<MenuItemSize> {
    constructor(
        @InjectRepository(MenuItemSize)
        private readonly sizeRepo: Repository<MenuItemSize>,
        private readonly sizeBuilder: MenuItemSizeBuilder,
        validator: MenuItemSizeValidator,
    ){ super(sizeRepo, sizeBuilder, validator, 'MenuItemSizeService'); }

    async create(dto: CreateMenuItemSizeDto): Promise<MenuItemSize | null> {
        const exists = await this.findOneByName(dto.name);
        if(exists){ return null; }

        const packageType = await this.sizeBuilder.buildCreateDto(dto);
        return await this.sizeRepo.save(packageType);
    }

    async update(id: number, dto: UpdateMenuItemSizeDto): Promise<MenuItemSize | null> {
        const toUpdate = await this.findOne(id);
        if(!toUpdate){ return null }

        await this.sizeBuilder.buildUpdateDto(toUpdate, dto);
        
        return await this.sizeRepo.save(toUpdate);
    }

    async findOneByName(name: string, relations?: Array<keyof MenuItemSize>): Promise<MenuItemSize | null> {
            return await this.sizeRepo.findOne({ where: { name: name }, relations });
    }
}