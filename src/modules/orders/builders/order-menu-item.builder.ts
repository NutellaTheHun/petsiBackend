import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { IBuildChildDto } from "../../../base/interfaces/IBuildChildEntity.interface";
import { MenuItemSizeService } from "../../menu-items/services/menu-item-size.service";
import { MenuItemService } from "../../menu-items/services/menu-item.service";
import { CreateChildOrderMenuItemDto } from "../dto/create-child-order-menu-item.dto";
import { CreateOrderMenuItemDto } from "../dto/create-order-menu-item.dto";
import { UpdateChildOrderMenuItemDto } from "../dto/update-child-order-menu-item.dto";
import { UpdateOrderMenuItemDto } from "../dto/update-order-menu-item.dto";
import { OrderMenuItem } from "../entities/order-menu-item.entity";
import { Order } from "../entities/order.entity";
import { OrderMenuItemService } from "../services/order-menu-item.service";
import { OrderService } from "../services/order.service";
import { OrderMenuItemValidator } from "../validators/order-menu-item.validator";

@Injectable()
export class OrderMenuItemBuilder extends BuilderBase<OrderMenuItem> implements IBuildChildDto<Order, OrderMenuItem>{
    constructor(
        @Inject(forwardRef(() => OrderService))
        private readonly orderService: OrderService,

        @Inject(forwardRef(() => OrderMenuItemService))
        private readonly orderItemService: OrderMenuItemService,

        private readonly menuItemService: MenuItemService,
        private readonly sizeService: MenuItemSizeService,
        validator: OrderMenuItemValidator,
    ){ super(OrderMenuItem, validator); }
    
    protected createEntity(dto: CreateOrderMenuItemDto): void {
        if(dto.menuItemId){
            this.menuItemById(dto.menuItemId);
        }
        if(dto.menuItemSizeId){
            this.menuItemSizeById(dto.menuItemSizeId);
        }
        if(dto.orderId){
            this.orderById(dto.orderId);
        }
        if(dto.quantity){
            this.quantity(dto.quantity);
        }
    }

    protected updateEntity(dto: UpdateOrderMenuItemDto): void {
        if(dto.menuItemId){
            this.menuItemById(dto.menuItemId);
        }
        if(dto.menuItemSizeId){
            this.menuItemSizeById(dto.menuItemSizeId);
        }
        if(dto.quantity){
            this.quantity(dto.quantity);
        }
    }
    
    buildChildEntity(dto: CreateChildOrderMenuItemDto): void {
        if(dto.menuItemId){
            this.menuItemById(dto.menuItemId);
        }
        if(dto.menuItemSizeId){
            this.menuItemSizeById(dto.menuItemSizeId);
        }
        if(dto.quantity){
            this.quantity(dto.quantity);
        }
    }

    async buildChildCreateDto(parentOrder: Order, dto: CreateChildOrderMenuItemDto): Promise<OrderMenuItem> {
        await this.validateCreateDto(dto);

        this.reset();

        this.entity.order = parentOrder;

        this.buildChildEntity(dto);

        return await this.build();
    }

    public async buildManyChildDto(parentOrder: Order, dtos: (CreateChildOrderMenuItemDto | UpdateChildOrderMenuItemDto)[]): Promise<OrderMenuItem[]> {
        const results: OrderMenuItem[] = [];
        for(const dto of dtos){
            if(dto.mode === 'create'){
                results.push(await this.buildChildCreateDto(parentOrder, dto));
            } else {
                const item = await this.orderItemService.findOne(dto.id);
                if(!item){ throw new Error("orderMenuItem not found"); }
                results.push( await this.buildUpdateDto(item, dto));
            }
        }
        return results;
    }

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
        return this.setPropByVal('quantity', amount);
    }
}