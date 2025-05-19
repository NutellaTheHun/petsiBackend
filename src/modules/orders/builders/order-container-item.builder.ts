import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { IBuildChildDto } from "../../../base/interfaces/IBuildChildEntity.interface";
import { AppLogger } from "../../app-logging/app-logger";
import { MenuItemSizeService } from "../../menu-items/services/menu-item-size.service";
import { MenuItemService } from "../../menu-items/services/menu-item.service";
import { RequestContextService } from "../../request-context/RequestContextService";
import { OrderContainerItem } from "../entities/order-container-item.entity";
import { OrderMenuItem } from "../entities/order-menu-item.entity";
import { OrderContainerItemService } from "../services/order-container-item.service";
import { OrderMenuItemService } from "../services/order-menu-item.service";
import { OrderContainerItemValidator } from "../validators/order-container-item.validator";
import { CreateChildOrderContainerItemDto } from "../dto/order-container-item/create-child-order-container-item.dto";
import { CreateOrderContainerItemDto } from "../dto/order-container-item/create-order-container-item.dto";
import { UpdateChildOrderContainerItemDto } from "../dto/order-container-item/update-child-order-container-item.dto";
import { UpdateOrderContainerItemDto } from "../dto/order-container-item/update-order-container-item.dto";

@Injectable()
export class OrderContainerItemBuilder extends BuilderBase<OrderContainerItem> implements IBuildChildDto<OrderMenuItem, OrderContainerItem>{
    constructor(
        @Inject(forwardRef(() => OrderContainerItemService))
        private readonly componentService: OrderContainerItemService,
        
        @Inject(forwardRef(() => OrderMenuItemService))
        private readonly orderItemService: OrderMenuItemService,

        private readonly menuItemService: MenuItemService,
        private readonly sizeService: MenuItemSizeService,

        validator: OrderContainerItemValidator,
        requestContextService: RequestContextService,
        logger: AppLogger,
    ){ super(OrderContainerItem, 'OrderMenuItemComponentBuilder',  requestContextService, logger, validator); }

    async buildChildCreateDto(parentItem: OrderMenuItem, dto: CreateChildOrderContainerItemDto): Promise<OrderContainerItem> {
        await this.validateCreateDto(dto);

        this.reset();

        this.entity.parentOrderItem = parentItem;

        this.buildChildEntity(dto);

        return await this.build();
    }

    buildChildEntity(dto: CreateChildOrderContainerItemDto): void {
        if(dto.containedItemSizeId){
            this.containedItemSizeById(dto.containedItemSizeId);
        }
        if(dto.containedMenuItemId){
            this.containedMenuItemById(dto.containedMenuItemId);
        }
        if(dto.quantity){
            this.quantity(dto.quantity);
        }
    }

    /**
     * Depreciated, only created as a child through {@link Order}.
     */
    protected createEntity(dto: CreateOrderContainerItemDto): void {
        if(dto.containedItemSizeId){
            this.containedItemSizeById(dto.containedItemSizeId);
        }
        if(dto.containedMenuItemId){
            this.containedMenuItemById(dto.containedMenuItemId);
        }
        if(dto.parentOrderMenuItemId){
            this.parentOrderMenuItemById(dto.parentOrderMenuItemId);
        }
        if(dto.quantity){
            this.quantity(dto.quantity);
        }
    }

    protected updateEntity(dto: UpdateOrderContainerItemDto): void {
        if(dto.containedItemSizeId){
            this.containedItemSizeById(dto.containedItemSizeId);
        }
        if(dto.containedMenuItemId){
            this.containedMenuItemById(dto.containedMenuItemId);
        }
        if(dto.quantity){
            this.quantity(dto.quantity);
        }
    }

    async buildManyChildDto(parentOrderItem: OrderMenuItem, dtos: (CreateChildOrderContainerItemDto | UpdateChildOrderContainerItemDto)[]): Promise<OrderContainerItem[]> {
        const results: OrderContainerItem[] = [];
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

    private containedItemSizeById(id: number): this {
        return this.setPropById(this.sizeService.findOne.bind(this.sizeService), 'containedItem', id);
    }

    private containedMenuItemById(id: number): this {
        return this.setPropById(this.menuItemService.findOne.bind(this.menuItemService), 'containedItem', id);
    }

    private quantity(amount: number): this {
        return this.setPropByVal('quantity', amount);
    }

    private parentOrderMenuItemById(id: number): this {
        return this.setPropById(this.orderItemService.findOne.bind(this.orderItemService), 'parentOrderItem', id);
    }
}