import { Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { CreateMenuItemSizeDto } from "../dto/create-menu-item-size.dto";
import { UpdateMenuItemSizeDto } from "../dto/update-menu-item-size.dto";
import { MenuItemSize } from "../entities/menu-item-size.entity";
import { MenuItemSizeValidator } from "../validators/menu-item-size.validator";

@Injectable()
export class MenuItemSizeBuilder extends BuilderBase<MenuItemSize> {

    constructor(
        validator: MenuItemSizeValidator,
    ){ super(MenuItemSize, validator); }

    protected async createEntity(dto: CreateMenuItemSizeDto): Promise<void> {
        if(dto.name){
            this.name(dto.name);
        }
    }

    protected async updateEntity(dto: UpdateMenuItemSizeDto): Promise<void> {
        if(dto.name){
            this.name(dto.name);
        }
    }

    public name(name: string): this {
        return this.setProp('name', name);
    }
/*
    public async buildCreateDto(dto: CreateMenuItemSizeDto): Promise<MenuItemSize> {
        this.reset();

        if(dto.name){
            this.name(dto.name);
        }
        
        return this.build();
    }

    public async buildUpdateDto(toUpdate: MenuItemSize, dto: UpdateMenuItemSizeDto): Promise<MenuItemSize> {
        this.reset();
        this.setEntity(toUpdate);

        if(dto.name){
            this.name(dto.name);
        }
        
        return this.build();
    }*/
}