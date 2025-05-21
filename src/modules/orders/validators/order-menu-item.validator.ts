import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { MenuItemSizeService } from "../../menu-items/services/menu-item-size.service";
import { MenuItemService } from "../../menu-items/services/menu-item.service";
import { UpdateChildOrderContainerItemDto } from "../dto/order-container-item/update-child-order-container-item.dto";
import { CreateChildOrderMenuItemDto } from "../dto/order-menu-item/create-child-order-menu-item.dto";
import { UpdateChildOrderMenuItemDto } from "../dto/order-menu-item/update-child-order-menu-item.dto";
import { UpdateOrderMenuItemDto } from "../dto/order-menu-item/update-order-menu-item.dto";
import { OrderMenuItem } from "../entities/order-menu-item.entity";
import { OrderContainerItemService } from "../services/order-container-item.service";
import { OrderMenuItemService } from "../services/order-menu-item.service";

@Injectable()
export class OrderMenuItemValidator extends ValidatorBase<OrderMenuItem> {
    constructor(
        @InjectRepository(OrderMenuItem)
        private readonly repo: Repository<OrderMenuItem>,

        @Inject(forwardRef(() => OrderMenuItemService))
        private readonly orderItemService: OrderMenuItemService,

        @Inject(forwardRef(() => OrderContainerItemService))
        private readonly containerItemService: OrderContainerItemService,

        private readonly menuItemService: MenuItemService,
        private readonly sizeService: MenuItemSizeService,
        
    ){ super(repo); }

    public async validateCreate(dto: CreateChildOrderMenuItemDto): Promise<string | null> {
        const menuItem = await this.menuItemService.findOne(dto.menuItemId, ['validSizes']);
        if(!menuItem.validSizes){ throw new Error('validSizes is null'); }

        // Check DTO ITEM and DTO SIZE are valid
        const validSize = this.helper.validateSize(dto.menuItemSizeId, menuItem.validSizes);
        if(!validSize){
            const invalidSize = await this.sizeService.findOne(dto.menuItemSizeId);
            return `size on dto ${invalidSize.name} with id ${invalidSize.id} is not a valid size for dto menu item ${menuItem.itemName} with id ${menuItem.id}`
        }

        // Check if order container item DTOS have duplicate item/item sizes
        if(dto.orderedItemContainerDtos){
            const hasDuplateItems = this.helper.hasDuplicatesByComposite(
                dto.orderedItemContainerDtos,
                (item) => `${item.containedMenuItemId}:${item.containedMenuItemSizeId}`
            );
            if(hasDuplateItems){
                return `order item container dtos contains duplicate item/item size`;
            }
        }

        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateOrderMenuItemDto | UpdateChildOrderMenuItemDto): Promise<string | null> {
        // check DTO ITEM and CURRENT SIZE are valid
        if(dto.menuItemId && !dto.menuItemSizeId){

            // Get current order item for CURRENT SIZE
            const currentOrderItem = await this.orderItemService.findOne(id, ['size']);
            if(!currentOrderItem){ throw new Error();}
            if(!currentOrderItem.size){ throw new Error();}

            // get DTO ITEM AS MENU ITEM for validSizes
            const newItem = await this.menuItemService.findOne(dto.menuItemId, ['validSizes']);
            if(!newItem){ throw new Error();}
            if(!newItem.validSizes){ throw new Error(); }

            // Check if CURRENT SIZE and DTO ITEM AS MENU ITEM are valid
            const validItemSize = this.helper.validateSize(currentOrderItem.size.id, newItem.validSizes);
            if(!validItemSize){
                return `new item ${newItem.itemName} with id ${newItem.id} is not valid with current order item\'s size ${currentOrderItem.size.name}`;
            }
        }

        // check DTO ITEM and DTO SIZE are valid
        else if(dto.menuItemId && dto.menuItemSizeId){
            // get DTO ITEM as MENU ITEM
            const newItem = await this.menuItemService.findOne(dto.menuItemId, ['validSizes']);
            if(!newItem.validSizes){ throw new Error('validSizes is null'); }

            // Check DTO SIZE and DTO ITEM AS MENU ITEM is valid
            const validItemSize = this.helper.validateSize(dto.menuItemSizeId, newItem.validSizes);
            if(!validItemSize){
                const invalidSize = await this.sizeService.findOne(dto.menuItemSizeId);
                return `new item ${newItem.itemName} with id ${newItem.id} is not valid with new size ${invalidSize.name} and id ${invalidSize.id}`;
            }
        }
        // check CURRENT ITEM and DTO SIZE are valid
        else if(dto.menuItemSizeId){
            // Get CURRENT ITEM
            const currentMenuItem = (await this.orderItemService.findOne(id, ['menuItem'], ['menuItem.validSizes'])).menuItem;
            if(!currentMenuItem){ throw new Error('current menuItem is null'); }
            if(!currentMenuItem.validSizes){ throw new Error('validSizes is null'); }
            
            // check CURRENT ITEM and DTO SIZE are valid
            const validItemSize = this.helper.validateSize(dto.menuItemSizeId, currentMenuItem.validSizes);
            if(!validItemSize){
                const invalidSize = await this.sizeService.findOne(dto.menuItemSizeId);
                return `new size ${invalidSize.name} with id ${invalidSize.id} is not valid for current item ${currentMenuItem.itemName} with id ${currentMenuItem.id}`;
            }  
        }

        // Validate:
        // item container DTOs cannot contain duplicate item/size combinations
        // item container DTOS cannot contain multiple updates for the same item
        if(dto.orderedItemContainerDtos){
            // check for multiple update DTOS for the same entity
            const duplicateIds = this.helper.hasDuplicates(
                dto.orderedItemContainerDtos.filter(dto => dto.mode === 'update').map(uDto => uDto.id),
            )
            if(duplicateIds){
                return `order item container updates dtos cannot have multiple update request for the same entity.`;
            } 

            // resolve update dto to have menuitem and size
            const resolvedDtos: {containedMenuItemId: number; containedMenuItemSizeId: number }[] = [];
            for(const d of dto.orderedItemContainerDtos){
                if(d.mode === 'create'){
                    resolvedDtos.push({
                        containedMenuItemId: d.containedMenuItemId,
                        containedMenuItemSizeId: d.containedMenuItemSizeId}
                    );
                }
                else if(d.mode === 'update'){
                    const updateDto = d as UpdateChildOrderContainerItemDto;
                    const currentItem = await this.containerItemService.findOne(updateDto.id, ['containedItem', 'containedItemSize']);
                    resolvedDtos.push({
                        containedMenuItemId: updateDto.containedMenuItemId ?? currentItem.containedItem.id,
                        containedMenuItemSizeId: updateDto.containedMenuItemSizeId ?? currentItem.containedItemSize.id
                    });
                }
            }
            const hasDuplateItems = this.helper.hasDuplicatesByComposite(
                resolvedDtos,
                (item) => `${item.containedMenuItemId}:${item.containedMenuItemSizeId}`
            );
            if(hasDuplateItems){
                return `order item container dtos contains duplicate item/item size`;
            }
        }
        
        return null;
    }
}