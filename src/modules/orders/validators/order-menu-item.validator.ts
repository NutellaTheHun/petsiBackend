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
        if(dto.orderedItemContainerDtos && dto.orderedItemContainerDtos.length > 0){
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

        // If updating menuItem or itemSize, check if size is valid for item
        if(dto.menuItemId || dto.menuItemSizeId){
            const currentOrderItem = await this.orderItemService.findOne(id, ['size', 'menuItem']);

            const sizeId = dto.menuItemSizeId ?? currentOrderItem.size.id;
            const itemId = dto.menuItemId ?? currentOrderItem.menuItem.id;

            const menuItem = await this.menuItemService.findOne(itemId, ['validSizes']);
            if(!menuItem){ throw new Error();}

            const isValidSize = this.helper.validateSize(sizeId, menuItem.validSizes);
            if(!isValidSize){
                const invalidSize = await this.sizeService.findOne(sizeId);
                return `item ${menuItem.itemName} with id ${menuItem.id} is not valid with item size ${invalidSize.name}`;
            }
        }
        
        // Validate:
        // item container DTOs cannot contain duplicate item/size combinations
        // item container DTOS cannot contain multiple updates for the same item
        if(dto.orderedItemContainerDtos && dto.orderedItemContainerDtos.length > 0){
            // resolve update dto to have menuitem and size
            const resolvedDtos: {containedMenuItemId: number; containedMenuItemSizeId: number }[] = [];
            const resolvedIds: {updateId: number; }[] = [];
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
                    resolvedIds.push({updateId: d.id});
                }
            }
            // Check duplicate update ids
            const hasDuplateIds = this.helper.hasDuplicatesByComposite(
                resolvedIds,
                (item) => `${item.updateId}`
            );
            if(hasDuplateIds){
                return `order item container updates dtos cannot have multiple update request for the same entity.`;
            }

            // Check duplicate ordered items
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