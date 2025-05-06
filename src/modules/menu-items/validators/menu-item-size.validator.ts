import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { MenuItemSize } from "../entities/menu-item-size.entity";

@Injectable()
export class MenuItemSizeValidator extends ValidatorBase<MenuItemSize> {
    constructor(
        @InjectRepository(MenuItemSize)
        private readonly repo: Repository<MenuItemSize>,
    ){ super(repo); }

    public async validateCreate(dto: any): Promise<string | null> {
        const exists = await this.repo.findOne({ where: { name: dto.name }});
        if(exists) { 
            return 'Menu item size already exists'; 
        }
        return null;
    }
    public async validateUpdate(dto: any): Promise<string | null> {
        return null;
    }
}