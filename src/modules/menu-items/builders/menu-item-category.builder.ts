import { forwardRef, Inject, Injectable, NotImplementedException } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { MenuItemCategory } from "../entities/menu-item-category.entity";
import { MenuItemService } from "../services/menu-item.service";
import { CreateMenuItemCategoryDto } from "../dto/create-menu-item-category.dto";
import { UpdateMenuItemCategoryDto } from "../dto/update-menu-item-category.dto";
import { MenuItemCategoryValidator } from "../validators/menu-item-category.validator";

@Injectable()
export class MenuItemCategoryBuilder extends BuilderBase<MenuItemCategory>{
    constructor(
        @Inject(forwardRef(() => MenuItemService))
        private readonly itemService: MenuItemService,
        validator: MenuItemCategoryValidator,
    ){ super(MenuItemCategory, validator); }

    protected async createEntity(dto: CreateMenuItemCategoryDto): Promise<void> {
        if(dto.name){
            this.name(dto.name);
        }
    }

    protected async updateEntity(dto: UpdateMenuItemCategoryDto): Promise<void> {
        if(dto.name){
            this.name(dto.name);
        }
    }

    public name(name: string): this {
        return this.setProp('name', name);
    }

    public menuItemsById(ids: number[]): this {
        return this.setPropsByIds(this.itemService.findEntitiesById.bind(this.itemService), 'items', ids);
    }
/*
    public async buildCreateDto(dto: CreateMenuItemCategoryDto): Promise<MenuItemCategory> {
        this.reset();
        
        if(dto.name){
            this.name(dto.name);
        }
  
        return this.build();
    }

    public async buildUpdateDto(toUpdate: MenuItemCategory, dto: UpdateMenuItemCategoryDto): Promise<MenuItemCategory> {
        this.reset();
        this.setEntity(toUpdate);

        if(dto.name){
            this.name(dto.name);
        }

        return this.build();
    }*/
}