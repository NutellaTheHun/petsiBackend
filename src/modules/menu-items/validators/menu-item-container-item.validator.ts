import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { CreateMenuItemContainerItemDto } from "../dto/menu-item-container-item/create-menu-item-container-item.dto";
import { UpdateChildMenuItemContainerItemDto } from "../dto/menu-item-container-item/update-child-menu-item-container-item.dto";
import { UpdateMenuItemContainerItemDto } from "../dto/menu-item-container-item/update-menu-item-container-item.dto";
import { MenuItemContainerItem } from "../entities/menu-item-container-item.entity";
import { MenuItemContainerItemService } from "../services/menu-item-container-item.service";
import { MenuItemSizeService } from "../services/menu-item-size.service";
import { MenuItemService } from "../services/menu-item.service";
import { CreateChildMenuItemContainerItemDto } from "../dto/menu-item-container-item/create-child-menu-item-container-item.dto";

@Injectable()
export class MenuItemContainerItemValidator extends ValidatorBase<MenuItemContainerItem> {
    constructor(
        @InjectRepository(MenuItemContainerItem)
        repo: Repository<MenuItemContainerItem>,

        @Inject(forwardRef(() => MenuItemContainerItemService))
        private readonly containerService: MenuItemContainerItemService,

        @Inject(forwardRef(() => MenuItemService))
        private readonly itemService: MenuItemService,
        
        private readonly sizeService: MenuItemSizeService,
    ){ super(repo); }

    public async validateCreate(dto: CreateChildMenuItemContainerItemDto): Promise<string | null> {
        //defined container items must reference a valid item size to the contained item. 
        const item = await this.itemService.findOne(dto.containedMenuItemId, ['validSizes']);

        // Validate the item's valid sizes contains the DTOs size
        const validItemSize = this.helper.validateSize(dto.containedMenuItemSizeId, item.validSizes)
        if(!validItemSize){
            const size = await this.sizeService.findOne(dto.containedMenuItemSizeId);
            return `size ${size.name} with id ${dto.containedMenuItemSizeId} is invalid for contained item ${item.itemName} with id ${item.id}`
        }

        //parent container and parent container size must be valid to each other
        const parentItem = await this.itemService.findOne(dto.parentContainerId, ['validSizes']);
        const validParentSize = this.helper.validateSize(dto.parentContainerSizeId, parentItem.validSizes)
        if(!validParentSize){
            const size = await this.sizeService.findOne(dto.parentContainerSizeId);
            return `size ${size.name} with id ${dto.containedMenuItemSizeId} is invalid for parent container item ${parentItem.itemName} with id ${parentItem.id}`
        }

        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateMenuItemContainerItemDto | UpdateChildMenuItemContainerItemDto): Promise<string | null> {

        // if updating to new item, must come with new size
        if(dto.containedMenuItemId && !dto.containedMenuItemSizeId){
            return 'updating menu item must be accompanied by new menuItemSize';
        }

        // If updating item and size
        if(dto.containedMenuItemId && dto.containedMenuItemSizeId){
            const item = await this.itemService.findOne(dto.containedMenuItemId, ['validSizes']);

            // Validate the item's valid sizes contains the DTOs size
            const validSize = this.helper.validateSize(dto.containedMenuItemSizeId, item.validSizes);
            if(!validSize){
                const size = await this.sizeService.findOne(dto.containedMenuItemSizeId);
                return `size ${size.name} with id ${dto.containedMenuItemSizeId} is invalid for contained item ${item.itemName} with id ${item.id}`
            }
        }
        // If updating just size, get current container item and validate
        else if(dto.containedMenuItemSizeId){
            const currentContainer = await this.containerService.findOne(id, ['containedItem']);
            const currentItem = await this.itemService.findOne(currentContainer.containedItem.id, ['validSizes']);

            // Validate the current item's valid sizes contains the DTOs size
            const validSize = this.helper.validateSize(dto.containedMenuItemSizeId, currentItem.validSizes)
            if(!validSize){
                const size = await this.sizeService.findOne(dto.containedMenuItemSizeId);
                return `size ${size.name} with id ${dto.containedMenuItemSizeId} is invalid for current item ${currentItem.itemName} with id ${currentItem.id}`;
            }
        }

        return null;
    }
}