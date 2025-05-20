import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { CreateMenuItemContainerItemDto } from "../dto/menu-item-container-item/create-menu-item-container-item.dto";
import { UpdateMenuItemContainerItemDto } from "../dto/menu-item-container-item/update-menu-item-container-item.dto";
import { MenuItemContainerItem } from "../entities/menu-item-container-item.entity";
import { MenuItemSizeService } from "../services/menu-item-size.service";
import { MenuItemService } from "../services/menu-item.service";
import { MenuItemContainerItemService } from "../services/menu-item-container-item.service";

@Injectable()
export class MenuItemContainerItemValidator extends ValidatorBase<MenuItemContainerItem> {
    constructor(
        @InjectRepository(MenuItemContainerItem)
        repo: Repository<MenuItemContainerItem>,
        private readonly itemService: MenuItemService,
        private readonly sizeService: MenuItemSizeService,
        private readonly containerService: MenuItemContainerItemService,
    ){ super(repo); }

    public async validateCreate(dto: CreateMenuItemContainerItemDto): Promise<string | null> {
        //defined container items must reference a valid item size to the contained item.
        if(dto.containedMenuItemId && dto.containedMenuItemSizeId){
            
            const item = await this.itemService.findOne(dto.containedMenuItemId, ['validSizes']);

            // Validate the item's valid sizes contains the DTOs size
            if(!item.validSizes.find(validSize => validSize.id === dto.containedMenuItemSizeId)){
                const size = await this.sizeService.findOne(dto.containedMenuItemSizeId);
                return `size ${size.name} with id ${dto.containedMenuItemSizeId} is invalid for contained item ${item.itemName} with id ${item.id}`
            }
        }
        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateMenuItemContainerItemDto): Promise<string | null> {

        // if updating to new item, must come with new size
        if(dto.containedMenuItemId && !dto.containedMenuItemSizeId){
            return 'updating menu item must be accompanied by new menuItemSize';
        }

        // If updating item and size
        if(dto.containedMenuItemId && dto.containedMenuItemSizeId){

            const item = await this.itemService.findOne(dto.containedMenuItemId, ['validSizes']);

            // Validate the item's valid sizes contains the DTOs size
            if(!item.validSizes.find(validSize => validSize.id === dto.containedMenuItemSizeId)){
                const size = await this.sizeService.findOne(dto.containedMenuItemSizeId);
                return `size ${size.name} with id ${dto.containedMenuItemSizeId} is invalid for contained item ${item.itemName} with id ${item.id}`
            }
        }
        // If updating just size, get current container item and validate
        else if(dto.containedMenuItemSizeId){

            const currentContainer = await this.containerService.findOne(id, ['containedItem']);
            const currentItem = await this.itemService.findOne(currentContainer.containedItem.id, ['validSizes']);

            // Validate the current item's valid sizes contains the DTOs size
            if(!currentItem.validSizes.find(validSize => validSize.id === dto.containedMenuItemSizeId)){
                const size = await this.sizeService.findOne(dto.containedMenuItemSizeId);
                return `size ${size.name} with id ${dto.containedMenuItemSizeId} is invalid for contained item ${currentItem.itemName} with id ${currentItem.id}`
            }
        }
        return null;
    }
}