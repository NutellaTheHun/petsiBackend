import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { OrderMenuItem } from "../entities/order-menu-item.entity";
import { UpdateOrderMenuItemDto } from "../dto/update-order-menu-item.dto";
import { CreateOrderMenuItemDto } from "../dto/create-order-menu-item.dto";
import { MenuItemService } from "../../menu-items/services/menu-item.service";
import { OrderMenuItemService } from "../services/order-menu-item.service";

@Injectable()
export class OrderMenuItemValidator extends ValidatorBase<OrderMenuItem> {
    constructor(
        @InjectRepository(OrderMenuItem)
        private readonly repo: Repository<OrderMenuItem>,

        @Inject(forwardRef(() => OrderMenuItemService))
        private readonly orderMenuItemService: OrderMenuItemService,
        
        private readonly menuItemService: MenuItemService,
    ){ super(repo); }

    public async validateCreate(dto: CreateOrderMenuItemDto): Promise<string | null> {
        const menuItem = await this.menuItemService.findOne(dto.menuItemId, ['validSizes']);
        if(!menuItem.validSizes){ throw new Error('validSizes is null'); }

        if(!menuItem.validSizes.find(size => size.id === dto.menuItemSizeId)){
            return 'orderMenuItem\'s menuItemSize is not a valid size to the given menuItem.';
        }

        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateOrderMenuItemDto): Promise<string | null> {
        if(dto.menuItemId && !dto.menuItemSizeId){
            return 'menu item update must be accompanie by a menuItemSize';
        }
        else if(dto.menuItemId && dto.menuItemSizeId){
            const menuItem = await this.menuItemService.findOne(dto.menuItemId, ['validSizes']);
            if(!menuItem.validSizes){ throw new Error('validSizes is null'); }

            if(!menuItem.validSizes.find(size => size.id === dto.menuItemSizeId)){
                return 'orderMenuItem\'s menuItemSize is not a valid size to the given menuItem.';
            }
        }
        else if(dto.menuItemSizeId){
            const currentMenuItem = (await this.orderMenuItemService.findOne(id, ['menuItem'], ['menuItem.validSizes'])).menuItem;
            if(!currentMenuItem){ throw new Error('current menuItem is null'); }
            if(!currentMenuItem.validSizes){ throw new Error('validSizes is null'); }
            
            if(!currentMenuItem.validSizes.find(size => size.id === dto.menuItemSizeId)){
                return 'orderMenuItem\'s menuItemSize is not a valid size to the current menuItem.';
            }  
        }
        
        return null;
    }
}