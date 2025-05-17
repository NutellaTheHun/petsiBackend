import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { IBuildChildDto } from "../../../base/interfaces/IBuildChildEntity.interface";
import { AppLogger } from "../../app-logging/app-logger";
import { MenuItemSizeService } from "../../menu-items/services/menu-item-size.service";
import { MenuItemService } from "../../menu-items/services/menu-item.service";
import { RequestContextService } from "../../request-context/RequestContextService";
import { CreateChildOrderMenuItemComponentDto } from "../dto/create-child-order-menu-item-component.dto";
import { CreateOrderMenuItemComponentDto } from "../dto/create-order-menu-item-component.dto";
import { UpdateChildOrderMenuItemComponentDto } from "../dto/update-child-order-menu-item-component.dto";
import { UpdateOrderMenuItemComponentDto } from "../dto/update-order-menu-item-component.dto";
import { OrderMenuItemComponent } from "../entities/order-menu-item-component.entity";
import { OrderMenuItem } from "../entities/order-menu-item.entity";
import { OrderMenuItemComponentService } from "../services/order-menu-item-component.service";
import { OrderMenuItemService } from "../services/order-menu-item.service";
import { OrderMenuItemComponentValidator } from "../validators/order-menu-item-component.validator";

@Injectable()
export class OrderMenuItemComponentBuilder extends BuilderBase<OrderMenuItemComponent> implements IBuildChildDto<OrderMenuItem, OrderMenuItemComponent>{
    constructor(
        @Inject(forwardRef(() => OrderMenuItemComponentService))
        private readonly componentService: OrderMenuItemComponentService,
        private readonly menuItemService: MenuItemService,
        private readonly sizeService: MenuItemSizeService,
        private readonly orderItemService: OrderMenuItemService,

        validator: OrderMenuItemComponentValidator,
        requestContextService: RequestContextService,
        logger: AppLogger,
    ){ super(OrderMenuItemComponent, 'OrderMenuItemComponentBuilder',  requestContextService, logger, validator); }

    async buildChildCreateDto(parentItem: OrderMenuItem, dto: CreateChildOrderMenuItemComponentDto): Promise<OrderMenuItemComponent> {
        await this.validateCreateDto(dto);

        this.reset();

        this.entity.parentOrderItem = parentItem;

        this.buildChildEntity(dto);

        return await this.build();
    }

    buildChildEntity(dto: CreateChildOrderMenuItemComponentDto): void {
        if(dto.componentItemSizeId){
            this.componentItemSizeById(dto.componentItemSizeId);
        }
        if(dto.componentMenuItemId){
            this.componentMenuItemById(dto.componentMenuItemId);
        }
        if(dto.quantity){
            this.quantity(dto.quantity);
        }
    }

    protected createEntity(dto: CreateOrderMenuItemComponentDto): void {
        if(dto.componentItemSizeId){
            this.componentItemSizeById(dto.componentItemSizeId);
        }
        if(dto.componentMenuItemId){
            this.componentMenuItemById(dto.componentMenuItemId);
        }
        if(dto.parentOrderMenuItemId){
            this.parentOrderMenuItemById(dto.parentOrderMenuItemId);
        }
        if(dto.quantity){
            this.quantity(dto.quantity);
        }
    }

    protected updateEntity(dto: UpdateOrderMenuItemComponentDto): void {
        if(dto.componentItemSizeId){
            this.componentItemSizeById(dto.componentItemSizeId);
        }
        if(dto.componentMenuItemId){
            this.componentMenuItemById(dto.componentMenuItemId);
        }
        if(dto.quantity){
            this.quantity(dto.quantity);
        }
    }

    async buildManyChildDto(parentOrderItem: OrderMenuItem, dtos: (CreateChildOrderMenuItemComponentDto | UpdateChildOrderMenuItemComponentDto)[]): Promise<OrderMenuItemComponent[]> {
        const results: OrderMenuItemComponent[] = [];
        for(const dto of dtos){
            if(dto.mode === 'create'){
                results.push(await this.buildChildCreateDto(parentOrderItem, dto));
            } else {
                const toUpdate = await this.componentService.findOne(dto.id);
                if(!toUpdate){ throw Error("order menu item component is null"); }
                results.push(await this.buildUpdateDto(toUpdate, dto))
            }
        }
        return results;
    }

    private componentItemSizeById(id: number): this {
        return this.setPropById(this.sizeService.findOne.bind(this.sizeService), 'itemSize', id);
    }

    private componentMenuItemById(id: number): this {
        return this.setPropById(this.menuItemService.findOne.bind(this.menuItemService), 'item', id);
    }

    private quantity(amount: number): this {
        return this.setPropByVal('quantity', amount);
    }

    private parentOrderMenuItemById(id: number): this {
        return this.setPropById(this.orderItemService.findOne.bind(this.orderItemService), 'parentOrderItem', id);
    }
}