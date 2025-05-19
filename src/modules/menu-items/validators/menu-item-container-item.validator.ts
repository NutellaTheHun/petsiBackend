import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { MenuItemContainerItem } from "../entities/menu-item-container-item.entity";
import { UpdateMenuItemContainerItemDto } from "../dto/menu-item-container-item/update-menu-item-container-item.dto";
import { CreateMenuItemContainerItemDto } from "../dto/menu-item-container-item/create-menu-item-container-item.dto";

@Injectable()
export class MenuItemContainerItemValidator extends ValidatorBase<MenuItemContainerItem> {
    constructor(
        @InjectRepository(MenuItemContainerItem)
        private readonly repo: Repository<MenuItemContainerItem>,
    ){ super(repo); }

    public async validateCreate(dto: CreateMenuItemContainerItemDto): Promise<string | null> {
        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateMenuItemContainerItemDto): Promise<string | null> {
        if(dto.containedMenuItemId && !dto.containedMenuItemSizeId){
            return 'updating menu item must be accompanied by new menuItemSize';
        }
        return null;
    }
}