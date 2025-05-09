import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { MenuItemComponent } from "../entities/menu-item-component.entity";
import { UpdateMenuItemComponentDto } from "../dto/update-menu-item-component.dto";

@Injectable()
export class MenuItemComponentValidator extends ValidatorBase<MenuItemComponent> {
    constructor(
        @InjectRepository(MenuItemComponent)
        private readonly repo: Repository<MenuItemComponent>,
    ){ super(repo); }

    public async validateCreate(dto: any): Promise<string | null> {
        return null;
    }
    public async validateUpdate(dto: UpdateMenuItemComponentDto): Promise<string | null> {
        if(dto.menuItemId && !dto.menuItemSizeId){
            return 'updating menu item must be accompanied by new menuItemSize';
        }
        return null;
    }
}