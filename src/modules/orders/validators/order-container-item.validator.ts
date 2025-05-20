import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { CreateOrderContainerItemDto } from "../dto/order-container-item/create-order-container-item.dto";
import { UpdateOrderContainerItemDto } from "../dto/order-container-item/update-order-container-item.dto";
import { OrderContainerItem } from "../entities/order-container-item.entity";
import { OrderMenuItemService } from "../services/order-menu-item.service";
import { MenuItemContainerOptionsService } from "../../menu-items/services/menu-item-container-options.service";

@Injectable()
export class OrderContainerItemValidator extends ValidatorBase<OrderContainerItem> {
    constructor(
        @InjectRepository(OrderContainerItem)
        private readonly repo: Repository<OrderContainerItem>,
        private readonly orderItemService: OrderMenuItemService,
        private readonly optionsService: MenuItemContainerOptionsService,
    ){ super(repo); }

    public async validateCreate(dto: CreateOrderContainerItemDto): Promise<string | null> {
        const parentOrderItem = await this.orderItemService.findOne(dto.parentOrderMenuItemId, ['menuItem'], ['menuItem.containerOptions']);
        if(!parentOrderItem.menuItem){ throw new Error(); }
        if(!parentOrderItem.menuItem.containerOptions){ throw new Error(); }
        
        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateOrderContainerItemDto): Promise<string | null> {
        return null;
    }
}