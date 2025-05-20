import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { CreateMenuItemDto } from "../dto/menu-item/create-menu-item.dto";
import { UpdateMenuItemDto } from "../dto/menu-item/update-menu-item.dto";
import { MenuItem } from "../entities/menu-item.entity";
import { MenuItemContainerItemService } from "../services/menu-item-container-item.service";

@Injectable()
export class MenuItemValidator extends ValidatorBase<MenuItem> {
    constructor(
        @InjectRepository(MenuItem)
        private readonly repo: Repository<MenuItem>,
        private readonly containerItemService: MenuItemContainerItemService,
    ){ super(repo); }

    public async validateCreate(dto: CreateMenuItemDto): Promise<string | null> {
        // Cannot already exist (name is used)
        const exists = await this.repo.findOne({ where: { itemName: dto.itemName }});
        if(exists) { 
            return `Menu item with name ${dto.itemName} already exists`; 
        }

        // Cannot assign both containerOptions and a definedContainer 
        if(dto.containerOptionDto && dto.definedContainerItemDtos){
            return `Cannot create MenuItem with both containerOptions and definedContainerItems`;
        }

        // no parentSize / item / size duplicate
        if(dto.definedContainerItemDtos){
            const duplicateItems = this.helper.hasDuplicatesByComposite(
                dto.definedContainerItemDtos,
                (item) => `${item.parentContainerSizeId}:${item.containedMenuItemId}:${item.containedMenuItemSizeId}`
            );
            if(duplicateItems){
                return `defined container has duplicate parentContainerSize / containedItem / containedItemSize combination`;
            }
        }

        // No duplicate validSizes
        const duplicateSizes = this.helper.hasDuplicatesByComposite(
            dto.validSizeIds,
            (size) => `${size}`
        )
        if(duplicateSizes){
            return `menu item to create has duplicate item size ids`;
        }

        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateMenuItemDto): Promise<string | null> {
        // Cannot change name to another existing item
        if(dto.itemName){
            const exists = await this.repo.findOne({ where: { itemName: dto.itemName }});
            if(exists) { 
                return `Menu item with name ${dto.itemName} already exists`; 
            }
        }

        // Cannot assign both containerOptions and a definedContainer
        if(dto.containerOptionDto && dto.definedContainerItemDtos){
            return `Cannot create MenuItem with both containerOptions and definedContainerItems`;
        }

        //If updating containerOptions or defined container, 
        // check current item if the other is currently referenced
        if(dto.containerOptionDto || dto.definedContainerItemDtos){
            const currentItem = await this.repo.findOne({ where: { id }, relations: ['definedContainerItems', 'containerOptions']});
            if(!currentItem){ throw new Error(); }

            // If updating definedContainer while item has container options
            if(currentItem?.containerOptions && dto.definedContainerItemDtos){
                if(dto.containerOptionDto !== null){
                    return `current item has containerOptions, must set to null before updating with defined container`;
                }
            }

            // If updating container options while item has definedContainer
            if(currentItem.definedContainerItems && currentItem.definedContainerItems?.length > 0 && dto.containerOptionDto){
                if(dto.definedContainerItemDtos !== null){
                    return `current item has a defined container, must set to null before updating with containerOptions`;
                }
            }
        }

        // no parentSize / item / size duplicate
        if(dto.definedContainerItemDtos){
            const resolvedDtos: {parentContainerSizeId: number; containedMenuItemId: number; containedMenuItemSizeId: number}[] = [];
            for(const d of dto.definedContainerItemDtos){
                if(d.mode === 'create'){
                    resolvedDtos.push({
                        parentContainerSizeId: d.parentContainerSizeId,
                        containedMenuItemId: d.containedMenuItemId,
                        containedMenuItemSizeId: d.containedMenuItemSizeId,
                    });
                }
                else if(d.mode === 'update'){
                    const currentItem = await this.containerItemService.findOne(d.id, ['containedItem', 'containedItemsize', 'parentContainerSize']);
                    resolvedDtos.push({
                        parentContainerSizeId: currentItem.parentContainer.id,
                        containedMenuItemId: d.containedMenuItemId ?? currentItem.containedItem.id,
                        containedMenuItemSizeId: d.containedMenuItemSizeId ?? currentItem.containedItemsize.id,
                    });
                }
            }
            const duplicateItems = this.helper.hasDuplicatesByComposite(
                resolvedDtos,
                (item) => `${item.parentContainerSizeId}:${item.containedMenuItemId}:${item.containedMenuItemSizeId}`
            );
            if(duplicateItems){
                return `defined container has duplicate parentContainerSize / containedItem / containedItemSize combination`;
            }
        }

        // No duplicate validSizes
        if(dto.validSizeIds){
            const duplicateSizes = this.helper.hasDuplicatesByComposite(
                dto.validSizeIds,
                (size) => `${size}`
            )
            if(duplicateSizes){
                return `menu item to create has duplicate item size ids`;
            }
        }
        
        
        return null;
    }
}