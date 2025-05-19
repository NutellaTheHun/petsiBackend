import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { MenuItemSize } from "../entities/menu-item-size.entity";
import { CreateMenuItemSizeDto } from "../dto/menu-item-size/create-menu-item-size.dto";
import { UpdateMenuItemSizeDto } from "../dto/menu-item-size/update-menu-item-size.dto";

@Injectable()
export class MenuItemSizeValidator extends ValidatorBase<MenuItemSize> {
    constructor(
        @InjectRepository(MenuItemSize)
        private readonly repo: Repository<MenuItemSize>,
    ){ super(repo); }

    public async validateCreate(dto: CreateMenuItemSizeDto): Promise<string | null> {
        const exists = await this.repo.findOne({ where: { name: dto.sizeName }});
        if(exists) { 
            return `Menu item size with name ${dto.sizeName} already exists`; 
        }
        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateMenuItemSizeDto): Promise<string | null> {
        return null;
    }
}