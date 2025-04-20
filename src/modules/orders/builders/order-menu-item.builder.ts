import { Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { MenuItemSizeService } from "../../menu-items/services/menu-item-size.service";
import { MenuItemService } from "../../menu-items/services/menu-item.service";
import { CreateOrderMenuItemDto } from "../dto/create-order-menu-item.dto";
import { UpdateOrderMenuItemDto } from "../dto/update-order-menu-item.dto";
import { OrderMenuItem } from "../entities/order-menu-item.entity";
import { OrderService } from "../services/order.service";
import { OrderMenuItemService } from "../services/order-menu-item.service";
import { Order } from "../entities/order.entity";

@Injectable()
export class OrderMenuItemBuilder extends BuilderBase<OrderMenuItem>{
    constructor(
        private readonly orderService: OrderService,
        private readonly orderItemService: OrderMenuItemService,
        private readonly menuItemService: MenuItemService,
        private readonly sizeService: MenuItemSizeService,
    ){ super(OrderMenuItem); }

    public orderById(id: number): this {
        return this.setPropById(this.orderService.findOne.bind(this.orderService), 'order', id);
    }

    public menuItemById(id: number): this {
        return this.setPropById(this.menuItemService.findOne.bind(this.menuItemService), 'menuItem', id);
    }

    public menuItemByName(name: string): this {
        return this.setPropByName(this.menuItemService.findOneByName.bind(this.menuItemService), 'menuItem', name);
    }

    public menuItemSizeById(id: number): this {
        return this.setPropById(this.sizeService.findOne.bind(this.sizeService), 'size', id);
    }

    public menuItemSizeByName(name: string): this {
        return this.setPropByName(this.sizeService.findOneByName.bind(this.sizeService), 'size', name);
    }

    public quantity(amount: number){
        return this.setProp('quantity', amount);
    }

    public async buildCreateDto(parentOrder: Order, dto: CreateOrderMenuItemDto): Promise<OrderMenuItem> {
        this.reset();

        if(dto.menuItemId){
            this.menuItemById(dto.menuItemId);
        }
        if(dto.menuItemSizeId){
            this.menuItemSizeById(dto.menuItemId);
        }
        /*if(dto.orderId){
            this.orderById(dto.orderId);
        }*/
        this.entity.order = parentOrder;

        if(dto.quantity){
            this.quantity(dto.quantity);
        }
        
        return await this.build();
    }

    public async buildUpdateDto(item: OrderMenuItem, dto: UpdateOrderMenuItemDto): Promise<OrderMenuItem> {
        this.reset();
        this.updateEntity(item);
        
        if(dto.menuItemId){
            this.menuItemById(dto.menuItemId);
        }
        if(dto.menuItemSizeId){
            this.menuItemSizeById(dto.menuItemSizeId);
        }
        /*if(dto.orderId){
            this.orderById(dto.orderId);
        }*/
        if(dto.quantity){
            this.quantity(dto.quantity);
        }

        return await this.build();
    }

    public async buildManyDto(parentOrder: Order, dtos: (CreateOrderMenuItemDto | UpdateOrderMenuItemDto)[]): Promise<OrderMenuItem[]> {
        const results: OrderMenuItem[] = [];
        for(const dto of dtos){
            if(dto.mode === 'create'){
                results.push( await this.buildCreateDto(parentOrder, dto));
            } else {
                const item = await this.orderItemService.findOne(dto.id, ['menuItem', 'order', 'size']);
                if(!item){ throw new Error("recipe ingredient not found"); }
                results.push( await this.buildUpdateDto(item, dto));
            }
        }
        return results;
    }
}