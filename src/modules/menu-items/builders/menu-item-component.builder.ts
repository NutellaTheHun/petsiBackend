import { Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { CreateMenuItemComponentDto } from "../dto/create-menu-item-component.dto";
import { UpdateMenuItemComponentDto } from "../dto/update-menu-item-component.dto";
import { MenuItemComponent } from "../entities/menu-item-component.entity";
import { MenuItemService } from "../services/menu-item.service";
import { MenuItemSizeService } from "../services/menu-item-size.service";

@Injectable()
export class MenuItemComponentBuilder extends BuilderBase<MenuItemComponent> {
    constructor(
        private readonly menuItemService: MenuItemService,
        private readonly itemSizeService: MenuItemSizeService,
    ){ super(MenuItemComponent); }

    public containerById(id: number): this{
        return this.setPropById(this.menuItemService.findOne.bind(this.menuItemService), 'container', id);
    }

    public containerByName(name: string): this{
        return this.setPropByName(this.menuItemService.findOneByName.bind(this.menuItemService), 'container', name);
    }

    public itemById(id: number): this{
        return this.setPropById(this.menuItemService.findOne.bind(this.menuItemService), 'item', id);
    }

    public itemByName(name: string): this{
        return this.setPropByName(this.menuItemService.findOneByName.bind(this.menuItemService), 'item', name);
    }

    public sizeById(id: number): this{
        return this.setPropById(this.itemSizeService.findOne.bind(this.itemSizeService), 'size', id);
    }

    public quantity(amount: number): this{
        return this.setProp('quantity', amount);
    }

    public async buildCreateDto(dto: CreateMenuItemComponentDto): Promise<MenuItemComponent> {
        this.reset();

        if(dto.containerId){
            this.containerById(dto.containerId);
        }
        if(dto.menuItemId){
            this.itemById(dto.menuItemId);
        }
        if(dto.menuItemSizeId){
            this.sizeById(dto.menuItemSizeId);
        }
        if(dto.quantity){
            this.quantity(dto.quantity);
        }

        return this.build();
    }

    public async buildUpdateDto(toUpdate: MenuItemComponent, dto: UpdateMenuItemComponentDto): Promise<MenuItemComponent> {
        this.reset();
        this.updateEntity(toUpdate);

        if(dto.containerId){
            this.containerById(dto.containerId);
        }
        if(dto.menuItemId){
            this.itemById(dto.menuItemId);
        }
        if(dto.menuItemSizeId){
            this.sizeById(dto.menuItemSizeId);
        }
        if(dto.quantity){
            this.quantity(dto.quantity);
        }
        
        return this.build();
    }
}