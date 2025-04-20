import { Injectable, NotImplementedException } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { MenuItemSize } from "../entities/menu-item-size.entity";
import { CreateMenuItemSizeDto } from "../dto/create-menu-item-size.dto";
import { UpdateMenuItemSizeDto } from "../dto/update-menu-item-size.dto";

@Injectable()
export class MenuItemSizeBuilder extends BuilderBase<MenuItemSize> {
    constructor(){ super(MenuItemSize); }

    public name(name: string): this {
        return this.setProp('name', name);
    }

    public async buildCreateDto(dto: CreateMenuItemSizeDto): Promise<MenuItemSize> {
        this.reset();

        if(dto.name){
            this.name(dto.name);
        }
        
        return this.build();
    }

    public async buildUpdateDto(toUpdate: MenuItemSize, dto: UpdateMenuItemSizeDto): Promise<MenuItemSize> {
        this.reset();
        this.updateEntity(toUpdate);

        if(dto.name){
            this.name(dto.name);
        }
        
        return this.build();
    }
}