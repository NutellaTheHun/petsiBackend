import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { CreateOrderContainerItemDto } from "../dto/order-container-item/create-order-container-item.dto";
import { UpdateOrderContainerItemDto } from "../dto/order-container-item/update-order-container-item.dto";
import { OrderContainerItem } from "../entities/order-container-item.entity";
import { OrderMenuItemService } from "../services/order-menu-item.service";
import { MenuItemService } from "../../menu-items/services/menu-item.service";

@Injectable()
export class OrderContainerItemValidator extends ValidatorBase<OrderContainerItem> {
    constructor(
        @InjectRepository(OrderContainerItem)
        private readonly repo: Repository<OrderContainerItem>,
        private readonly orderItemService: OrderMenuItemService,
        private readonly sizeService: MenuItemService,
    ){ super(repo); }

    public async validateCreate(dto: CreateOrderContainerItemDto): Promise<string | null> {

        // Get containerOptions and their rules from the parent item
        const parentOrderItem = await this.orderItemService.findOne(dto.parentOrderMenuItemId,
             ['menuItem'], ['menuItem.containerOptions.containerRules.validItem']);
        if(!parentOrderItem.menuItem){ throw new Error(); }
        if(!parentOrderItem.menuItem.containerOptions){ throw new Error(); }
        
        // check if item in dto is valid for parent container
        const options = parentOrderItem.menuItem.containerOptions;

        const rule = options.containerRules.find(rule => rule.validItem.id === dto.containedMenuItemId);
        if(!rule){
            return `contained item ${parentOrderItem.menuItem.itemName} is not valid for the container`;
        }

        // check if the size in dto is valid for the parent container
        if(!rule.validSizes.find(size => size.id === dto.containedMenuItemSizeId)){

            const size = await this.sizeService.findOne(dto.containedMenuItemSizeId)
            return `dto size ${size.itemName} with id ${dto.containedMenuItemSizeId} is not valid for the contained item ${parentOrderItem.menuItem.itemName} with id ${parentOrderItem.menuItem.id}`
        }

        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateOrderContainerItemDto): Promise<string | null> {
        // if new item but no new sizing
        // check if item is valid with rules
        // check if new item is valid with current sizing
        if(dto.containedMenuItemId && !dto.containedMenuItemSizeId){
            
        }
        //if new item and sizing, check sizing is
        // check if item is valid with rules
        // check if size is valid with item
        // check if size is valid with rules
        if(dto.containedMenuItemId && dto.containedMenuItemSizeId){

        }
        // if new sizing with current item
        // check if size is valid with rules and item
        else if(dto.containedMenuItemSizeId){

        }
        return null;
    }
}