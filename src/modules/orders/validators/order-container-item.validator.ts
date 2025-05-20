import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { MenuItemContainerOptions } from "../../menu-items/entities/menu-item-container-options.entity";
import { MenuItemSizeService } from "../../menu-items/services/menu-item-size.service";
import { MenuItemService } from "../../menu-items/services/menu-item.service";
import { CreateChildOrderContainerItemDto } from "../dto/order-container-item/create-child-order-container-item.dto";
import { UpdateChildOrderContainerItemDto } from "../dto/order-container-item/update-child-order-container-item.dto";
import { OrderContainerItem } from "../entities/order-container-item.entity";
import { OrderContainerItemService } from "../services/order-container-item.service";
import { MenuItemContainerRule } from "../../menu-items/entities/menu-item-container-rule.entity";
import { UpdateOrderContainerItemDto } from "../dto/order-container-item/update-order-container-item.dto";

@Injectable()
export class OrderContainerItemValidator extends ValidatorBase<OrderContainerItem> {
    constructor(
        @InjectRepository(OrderContainerItem)
        repo: Repository<OrderContainerItem>,
        private readonly sizeService: MenuItemSizeService,
        private readonly containerItemService: OrderContainerItemService,
        private readonly itemService: MenuItemService,
    ){ super(repo); }

    public async validateCreate(dto: CreateChildOrderContainerItemDto): Promise<string | null> {

        // Get parent container options with rules
        const options = await this.getContainerOptions(dto.parentContainerMenuItemId);
        if(!options){ throw new Error("options is null"); }
        
        // check if DTO ITEM is valid in CONTAINER
        const rule = this.GetItemRule(dto.containedMenuItemId, options.containerRules);
        if(!rule){ 
            return `item in dto is not valid for container`;
        }

        // check if the DTO SIZE is valid in the CONTAINER
        const validSize = this.helper.validateSize(dto.containedMenuItemSizeId, rule.validSizes);
        if(!validSize){
            const size = await this.sizeService.findOne(dto.containedMenuItemSizeId);
            const container = await this.itemService.findOne(dto.parentContainerMenuItemId);
            return `dto size ${size.name} with id ${size.id} is not valid in the parent container item ${container.itemName} with id ${container.id}`
        }

        // check if the DTO SIZE is valid for the MENU ITEM:
        const item = await this.itemService.findOne(dto.containedMenuItemId, ['validSizes']);
        if(!item){ throw new Error(); }
        const validMenuItemSize = this.helper.validateSize(dto.containedMenuItemSizeId, item.validSizes);
        if(!validMenuItemSize){
            const size = await this.sizeService.findOne(dto.containedMenuItemSizeId);
            return `dto size ${size.name} with id ${size.id} is not valid for the contained item ${item.itemName} with id ${item.id}`
        }

        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateOrderContainerItemDto | UpdateChildOrderContainerItemDto): Promise<string | null> {
        // requires ParentContainer id to validate contained item and size (needs to get container rules)
        if(dto.containedMenuItemId && dto.containedMenuItemSizeId && !dto.parentContainerMenuItemId){
            return 'dto requires the parentContainerMenuItemId for validation';
        }
        else if(dto.containedMenuItemId && !dto.parentContainerMenuItemId){
            return 'dto requires the parentContainerMenuItemId for validation';
        }
        else if(dto.containedMenuItemSizeId && !dto.parentContainerMenuItemId){
            return 'dto requires the parentContainerMenuItemId for validation';
        }

        // If DTO ITEM and DTO SIZE
        else if(dto.containedMenuItemId && dto.containedMenuItemSizeId && dto.parentContainerMenuItemId){

            // Get parent container options with rules
            const options = await this.getContainerOptions(dto.parentContainerMenuItemId);
            if(!options){ throw new Error("options is null"); }
            
            // check if DTO ITEM is valid in CONTAINER
            const rule = this.GetItemRule(dto.containedMenuItemId, options.containerRules);
            if(!rule){ 
                return `item in dto is not valid for container`;
            }

            // check if the DTO SIZE is valid in the CONTAINER
            const validSize = this.helper.validateSize(dto.containedMenuItemSizeId, rule.validSizes);
            if(!validSize){
                const size = await this.sizeService.findOne(dto.containedMenuItemSizeId);
                const container = await this.itemService.findOne(dto.parentContainerMenuItemId);
                return `dto size ${size.name} with id ${size.id} is not valid in the parent container item ${container.itemName} with id ${container.id}`
            }

            // check if the DTO SIZE is valid for the MENU ITEM:
            const item = await this.itemService.findOne(dto.containedMenuItemId, ['validSizes']);
            if(!item){ throw new Error(); }
            const validMenuItemSize = this.helper.validateSize(dto.containedMenuItemSizeId, item.validSizes);
            if(!validMenuItemSize){
                const size = await this.sizeService.findOne(dto.containedMenuItemSizeId);
                return `dto size ${size.name} with id ${size.id} is not valid for the contained item ${item.itemName} with id ${item.id}`
            }
        }

        // IF DTO ITEM with CURRENT SIZE
        else if(dto.containedMenuItemId && !dto.containedMenuItemSizeId && dto.parentContainerMenuItemId){

            // Get OrderContainerItem being updated
            const containerItem = await this.containerItemService.findOne(id, ['parentOrderItem', 'containedItemSize']);
            if(!containerItem){ throw new Error(); }
            if(!containerItem.parentOrderItem){ throw new Error(); }

            // Get MENU ITEM from DTO ITEM for validSizes
            const newItem = await this.itemService.findOne(dto.containedMenuItemId, ['validSizes']);
            if(!newItem){ throw new Error(); }
            if(!newItem.validSizes){ throw new Error(); }

            // check if CURRENT SIZE is valid with DTO ITEM as MENU ITEM:
            const validMenuItemSize = this.helper.validateSize(containerItem.containedItemSize.id, newItem.validSizes);
            if(!validMenuItemSize){
                const size = await this.sizeService.findOne(containerItem.containedItemSize.id);
                return `current size ${size.name} with id ${size.id} is not valid a valid size for the contained item (menuItem.validSize) ${newItem.itemName} with id ${newItem.id}`
            }
            
            // Get parent container options with rules
            const options = await this.getContainerOptions(dto.parentContainerMenuItemId);
            if(!options){ throw new Error("options is null"); }

            // check if DTO ITEM is valid in CONTAINER
            const rule = this.GetItemRule(dto.containedMenuItemId, options.containerRules);
            if(!rule){ 
                return `item in dto is not valid for container`;
            }

            // check if DTO ITEM and the CURRENT are valid
            const validContainedSize = this.helper.validateSize(containerItem.containedItemSize.id, rule.validSizes);
            if(!validContainedSize){
                const size = await this.sizeService.findOne(containerItem.containedItemSize.id);
                return `current size ${size.name} with id ${size.id} is not valid within the new contained item\'s rule ${newItem.itemName} with id ${newItem.id}`
            }
        }
        // if DTO SIZE with CURRENT ITEM
        else if(dto.containedMenuItemSizeId && dto.parentContainerMenuItemId){
            // Get OrderContainerItem being updated
            const containerItem = await this.containerItemService.findOne(id, ['parentOrderItem', 'containedItemSize']);
            if(!containerItem){ throw new Error(); }
            if(!containerItem.parentOrderItem){ throw new Error(); }

            // Get MENU ITEM from CURRENT ITEM for validSizes
            const currentItem = await this.itemService.findOne(containerItem.containedItem.id, ['validSizes']);
            if(!currentItem){ throw new Error(); }
            if(!currentItem.validSizes){ throw new Error(); }

            // check if DTO SIZE is valid with DTO ITEM as MENU ITEM:
            const validItemSize = this.helper.validateSize(dto.containedMenuItemSizeId, currentItem.validSizes)
            if(!validItemSize){
                return `dto size ${containerItem.containedItemSize.name} are invalid is not a valid size for current item ${currentItem.itemName} (not a valid item on menuItem settings)`;
            }

            // Get parent container options with rules
            const options = await this.getContainerOptions(dto.parentContainerMenuItemId);
            if(!options){ throw new Error("options is null"); }

            // Get RULE for CURRENT ITEM
            const rule = options.containerRules.find(rule => rule.validItem.id === containerItem.containedItem.id);
            if(!rule){ throw new Error(); }

            // check DTO SIZE and CURRENT ITEM are valid in rule
            const validRuleSize = this.helper.validateSize(dto.containedMenuItemSizeId, rule.validSizes);
            if(!validRuleSize){
                const size = await this.sizeService.findOne(dto.containedMenuItemSizeId);
                return `dto size ${size.name} with id ${dto.containedMenuItemSizeId} is not valid for the contained item ${currentItem.itemName} with id ${currentItem.id}`
            }
        }
        return null;
    }

    private async getContainerOptions(parentContainerMenuItemId: number): Promise<MenuItemContainerOptions | null> {
        const parentContainer = await this.itemService.findOne(parentContainerMenuItemId, ['containerOptions'])
        if(!parentContainer){ throw new Error("parent container is null"); }
        if(!parentContainer.containerOptions){ return null; }
        return parentContainer.containerOptions;
    }

    /**
     * Searches a array of {@link MenuItemContainerRule} for the given {@link MenuItem} and returns it
     * or null if not found.
     * 
     * @param itemToValidateId The id of the current {@link OrderContainerItem.containedItem} 
     * or id of the incoming DTO's containedMenuItemId property.
     * 
     * @param rules The set of {@link MenuItemContainerRule} of the parent container (is within the parent's {@link MenuItemContainerOptions})
     * 
     * @returns 
     * The {@link MenuItemContainerRule} where the validItem matches the {@link itemToValidateId}, or null if not found.
     */
    private GetItemRule(itemToValidateId: number, rules: MenuItemContainerRule[]): MenuItemContainerRule | null {
        const rule = rules.find(rule => rule.validItem.id === itemToValidateId);
        if(!rule){
            return null; 
        }
        return rule;
    }
}