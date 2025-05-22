import { forwardRef, Inject, Injectable } from "@nestjs/common";
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
import { MenuItemContainerOptionsService } from "../../menu-items/services/menu-item-container-options.service";

@Injectable()
export class OrderContainerItemValidator extends ValidatorBase<OrderContainerItem> {
    constructor(
        @InjectRepository(OrderContainerItem)
        repo: Repository<OrderContainerItem>,

        @Inject(forwardRef(() => OrderContainerItemService))
        private readonly containerItemService: OrderContainerItemService,

        @Inject(forwardRef(() => MenuItemSizeService))
        private readonly sizeService: MenuItemSizeService,

        @Inject(forwardRef(() => MenuItemService))
        private readonly itemService: MenuItemService,

        private readonly optionsService: MenuItemContainerOptionsService,
    ){ super(repo); }

    public async validateCreate(dto: CreateChildOrderContainerItemDto): Promise<string | null> {

        // Get parent container options with rules
        const options = await this.getContainerOptions(dto.parentContainerMenuItemId);
        if(!options){ 
            // check that parentItem is a definedContainer
            const parentMenuItem = await this.itemService.findOne(dto.parentContainerMenuItemId, ['definedContainerItems']);
            if(!parentMenuItem){ throw new Error();}
            if(!parentMenuItem.definedContainerItems){ throw new Error();}

            if(parentMenuItem.definedContainerItems.length > 0){
                return null;
            }
            
            throw new Error("parent container item has no options and isn't a defined container."); 
        }
        
        // check if DTO ITEM is valid in CONTAINER
        const rule = this.GetItemRule(dto.containedMenuItemId, options.containerRules);
        if(!rule){ 
            return `item in dto is not valid for container`;
        }

        // check if the DTO SIZE is valid for the MENU ITEM:
        const item = await this.itemService.findOne(dto.containedMenuItemId, ['validSizes']);
        if(!item){ throw new Error(); }
        const validMenuItemSize = this.helper.validateSize(dto.containedMenuItemSizeId, item.validSizes);
        if(!validMenuItemSize){
            const size = await this.sizeService.findOne(dto.containedMenuItemSizeId);
            return `dto size ${size.name} with id ${size.id} is not valid for the contained item ${item.itemName} with id ${item.id}`;
        }

        // check if the DTO SIZE is valid in the CONTAINER
        const validSize = this.helper.validateSize(dto.containedMenuItemSizeId, rule.validSizes);
        if(!validSize){
            const size = await this.sizeService.findOne(dto.containedMenuItemSizeId);
            const container = await this.itemService.findOne(dto.parentContainerMenuItemId);
            return `dto size ${size.name} with id ${size.id} is not valid in the parent container item ${container.itemName} with id ${container.id}`
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

       
        if((dto.containedMenuItemId || dto.containedMenuItemSizeId) && dto.parentContainerMenuItemId){
            const containerItem = await this.containerItemService.findOne(id, ['containedItem', 'containedItemSize']);

            const itemId = dto.containedMenuItemId ?? containerItem.containedItem.id;
            const containedItem = await this.itemService.findOne(itemId, ['validSizes']);
            if(!containedItem){ throw new Error(); }

            const sizeId = dto.containedMenuItemSizeId ?? containerItem.containedItemSize.id;
            const containedSize = await this.sizeService.findOne(sizeId);
            if(!containedSize){ throw new Error(); }

            const options = await this.getContainerOptions(dto.parentContainerMenuItemId);
            if(!options){ throw new Error("options is null"); }

            let rule: MenuItemContainerRule | null = null;

            // Check item is valid in container
            if(dto.containedMenuItemId){
                rule = this.GetItemRule(dto.containedMenuItemId, options.containerRules);
                if(!rule){ 
                    return `item in dto is not valid for container`;
                }
                const validMenuItemSize = this.helper.validateSize(sizeId, containedItem.validSizes);
                if(!validMenuItemSize){
                    const size = await this.sizeService.findOne(sizeId);
                    return `dto size ${size.name} with id ${size.id} is not valid for the current item ${containedItem.itemName} with id ${containedItem.id}`;
                }
            }
            //check size is valid for item
            if(dto.containedMenuItemId && dto.containedMenuItemSizeId){
                const validMenuItemSize = this.helper.validateSize(dto.containedMenuItemSizeId, containedItem.validSizes);
                if(!validMenuItemSize){
                    const size = await this.sizeService.findOne(dto.containedMenuItemSizeId);
                    return `dto size ${size.name} with id ${size.id} is not valid for the contained item ${containedItem.itemName} with id ${containedItem.id}`;
                }
            }
            //check size is valid in container
            if(dto.containedMenuItemSizeId){
                if(!rule){
                    rule = this.GetItemRule(itemId, options.containerRules);
                    if(!rule){ 
                        return `item in dto is not valid for container`;
                    }
                }
                const validSize = this.helper.validateSize(dto.containedMenuItemSizeId, rule.validSizes);
                if(!validSize){
                    const size = await this.sizeService.findOne(dto.containedMenuItemSizeId);
                    const container = await this.itemService.findOne(dto.parentContainerMenuItemId);
                    return `dto size ${size.name} with id ${size.id} is not valid in the parent container item ${container.itemName} with id ${container.id}`;
                }
            }
        }

        return null;
    }

    private async getContainerOptions(parentContainerMenuItemId: number): Promise<MenuItemContainerOptions | null> {
        const parentContainer = await this.itemService.findOne(parentContainerMenuItemId, ['containerOptions']);
        if(!parentContainer){ throw new Error("parent container is null"); }
        if(!parentContainer.containerOptions){ return null; }
        const options = await this.optionsService.findOne(parentContainer.containerOptions.id, ['containerRules']);
        return options;
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