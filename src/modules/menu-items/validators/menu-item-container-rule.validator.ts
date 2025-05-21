import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { CreateMenuItemContainerRuleDto } from "../dto/menu-item-container-rule/create-menu-item-container-rule.dto";
import { UpdateMenuItemContainerRuleDto } from "../dto/menu-item-container-rule/update-menu-item-container-rule.dto";
import { MenuItemContainerRule } from "../entities/menu-item-container-rule.entity";
import { MenuItemService } from "../services/menu-item.service";
import { MenuItemContainerRuleService } from "../services/menu-item-container-rule.service";

@Injectable()
export class MenuItemContainerRuleValidator extends ValidatorBase<MenuItemContainerRule> {
    constructor(
        @InjectRepository(MenuItemContainerRule)
        repo: Repository<MenuItemContainerRule>,
        
        @Inject(forwardRef(() => MenuItemService))
        private readonly menuItemService: MenuItemService,
        
        @Inject(forwardRef(() => MenuItemContainerRuleService))
        private readonly containerRuleService: MenuItemContainerRuleService,
    ){ super(repo); }

    public async validateCreate(dto: CreateMenuItemContainerRuleDto): Promise<string | null> {
        // Must have sizes with the item, otherwise item cannot be added to container
        if(dto.validSizeIds.length === 0){
            return 'validSizes is empty.'
        }

        // sizes must be valid to the menu item in general
        // ContainerRule.validItem.validSizes is a superset of ContainerRule.validSize.
        const item = await this.menuItemService.findOne(dto.validMenuItemId, ['validSizes']);
        if(!item){ throw new Error('item not found'); }
        if(!item.validSizes){ throw new Error('valid sizes not found'); }
        for(const sizeToCheck of dto.validSizeIds){
            if(!item.validSizes.find(itemSize => itemSize.id === sizeToCheck)){
                return `invalid size with id ${sizeToCheck} assigned to validItem ${item.itemName} with id ${item.id}`
            }
        }
        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateMenuItemContainerRuleDto): Promise<string | null> {
        // Must have sizes with the item, otherwise item cannot be added to container
        if(dto.validSizeIds?.length === 0){
            return 'validSizes is empty.'
        }

        // sizes must be valid to the menu item in general
        // ContainerRule.validItem.validSizes is a superset of ContainerRule.validSize.
        if(dto.validMenuItemId && dto.validSizeIds){
            const item = await this.menuItemService.findOne(dto.validMenuItemId, ['validSizes']);
            if(!item){ throw new Error('item not found'); }
            if(!item.validSizes){ throw new Error('valid sizes not found'); }
            for(const sizeToCheck of dto.validSizeIds){
                if(!item.validSizes.find(itemSize => itemSize.id === sizeToCheck)){
                    return `invalid size with id ${sizeToCheck} assigned to validItem ${item.itemName} with id ${item.id}`
                }
            }
        }
        // If updating the validSizes, get the current item
        // then check that the new validSizes are contained within the currentItem's validItems.
        else if(dto.validSizeIds){
            const currentRule = await this.containerRuleService.findOne(id, ['validItem']);
            if(!currentRule){ throw new Error('item not found'); }
            if(!currentRule.validItem){ throw new Error('valid sizes not found'); }

            const currentItem = await this.menuItemService.findOne(currentRule.validItem.id, ['validSizes'])
            for(const sizeToCheck of dto.validSizeIds){
                if(!currentItem.validSizes.find(itemSize => itemSize.id === sizeToCheck)){
                    return `invalid size with id ${sizeToCheck} assigned to current item ${currentItem.itemName} with id ${currentItem.id}`
                }
            }
        }
        return null;
    }
}