import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { CreateChildOrderMenuItemDto } from "../dto/order-menu-item/create-child-order-menu-item.dto";
import { UpdateOrderMenuItemDto } from "../dto/order-menu-item/update-order-menu-item.dto";
import { CreateOrderDto } from "../dto/order/create-order.dto";
import { UpdateOrderDto } from "../dto/order/update-order.dto";
import { Order } from "../entities/order.entity";
import { OrderCategoryService } from "../services/order-category.service";
import { OrderMenuItemService } from "../services/order-menu-item.service";
import { OrderValidator } from "../validators/order.validator";
import { OrderMenuItemBuilder } from "./order-menu-item.builder";

@Injectable()
export class OrderBuilder extends BuilderBase<Order> {
    constructor(
        private readonly typeService: OrderCategoryService,

        @Inject(forwardRef(() => OrderMenuItemService))
        private readonly itemService: OrderMenuItemService,

        @Inject(forwardRef(() => OrderMenuItemBuilder))
        private readonly itemBuilder: OrderMenuItemBuilder,

        @Inject(forwardRef(() => OrderValidator))
        validator: OrderValidator,

        requestContextService: RequestContextService,
        logger: AppLogger,
    ) { super(Order, 'OrderBuilder', requestContextService, logger, validator); }

    protected createEntity(dto: CreateOrderDto): void {
        if (dto.deliveryAddress !== undefined) {
            this.deliveryAddress(dto.deliveryAddress);
        }
        if (dto.email !== undefined) {
            this.email(dto.email);
        }
        if (dto.fulfillmentDate !== undefined) {
            this.fulfillmentDate(dto.fulfillmentDate);
        }
        if (dto.fulfillmentType !== undefined) {
            this.fulfillmentType(dto.fulfillmentType);
        }
        if (dto.isFrozen !== undefined) {
            this.isFrozen(dto.isFrozen);
        }
        if (dto.isWeekly !== undefined) {
            this.isWeekly(dto.isWeekly);
        }
        if (dto.note !== undefined) {
            this.note(dto.note);
        }
        if (dto.orderedMenuItemDtos !== undefined) {
            this.orderedItemsByBuilder(this.entity.id, dto.orderedMenuItemDtos)
        }
        if (dto.orderCategoryId !== undefined) {
            this.categoryById(dto.orderCategoryId);
        }
        if (dto.phoneNumber !== undefined) {
            this.phoneNumber(dto.phoneNumber);
        }
        if (dto.recipient !== undefined) {
            this.recipient(dto.recipient);
        }
        if (dto.weeklyFulfillment !== undefined) {
            this.weeklyFulfillment(dto.weeklyFulfillment);
        }
        if (dto.fulfillmentContactName !== undefined) {
            this.fulfillmentContactName(dto.fulfillmentContactName);
        }
    }

    protected updateEntity(dto: UpdateOrderDto): void {
        if (dto.deliveryAddress !== undefined) {
            this.deliveryAddress(dto.deliveryAddress);
        }
        if (dto.email !== undefined) {
            this.email(dto.email);
        }
        if (dto.fulfillmentDate !== undefined) {
            this.fulfillmentDate(dto.fulfillmentDate);
        }
        if (dto.fulfillmentType !== undefined) {
            this.fulfillmentType(dto.fulfillmentType);
        }
        if (dto.isFrozen !== undefined) {
            this.isFrozen(dto.isFrozen);
        }
        if (dto.isWeekly !== undefined) {
            this.isWeekly(dto.isWeekly);
        }
        if (dto.note !== undefined) {
            this.note(dto.note);
        }
        if (dto.orderedMenuItemDtos !== undefined) {
            this.orderedItemsByBuilder(this.entity.id, dto.orderedMenuItemDtos)
        }
        if (dto.orderCategoryId !== undefined) {
            this.categoryById(dto.orderCategoryId);
        }
        if (dto.phoneNumber !== undefined) {
            this.phoneNumber(dto.phoneNumber);
        }
        if (dto.recipient !== undefined) {
            this.recipient(dto.recipient);
        }
        if (dto.weeklyFulfillment !== undefined) {
            this.weeklyFulfillment(dto.weeklyFulfillment);
        }
        if (dto.fulfillmentContactName !== undefined) {
            this.fulfillmentContactName(dto.fulfillmentContactName);
        }
    }

    public categoryById(id: number): this {
        return this.setPropById(this.typeService.findOne.bind(this.typeService), 'orderCategory', id);
    }

    public categoryByName(name: string): this {
        return this.setPropByName(this.typeService.findOneByName.bind(this.typeService), 'orderCategory', name);
    }

    public recipient(name: string): this {
        return this.setPropByVal('recipient', name);
    }

    public fulfillmentDate(date: Date): this {
        return this.setPropByVal('fulfillmentDate', date);
    }

    public fulfillmentType(type: string): this {
        return this.setPropByVal('fulfillmentType', type);
    }

    public deliveryAddress(address: string | null): this {
        if (address === null) {
            return this.setPropByVal('deliveryAddress', null);
        }
        return this.setPropByVal('deliveryAddress', address);
    }

    public phoneNumber(number: string | null): this {
        if (number === null) {
            return this.setPropByVal('phoneNumber', null);
        }
        return this.setPropByVal('phoneNumber', number);
    }

    public email(email: string | null): this {
        if (email === null) {
            return this.setPropByVal('email', null);
        }
        return this.setPropByVal('email', email);
    }

    public note(note: string | null): this {
        if (note === null) {
            return this.setPropByVal('note', null);
        }
        return this.setPropByVal('note', note);
    }

    public isFrozen(val: boolean): this {
        return this.setPropByVal('isFrozen', val);
    }

    public isWeekly(val: boolean): this {
        return this.setPropByVal('isWeekly', val);
    }

    public orderedItemsById(ids: number[]): this {
        return this.setPropsByIds(this.itemService.findEntitiesById.bind(this.itemService), 'orderedItems', ids);
    }

    public orderedItemsByBuilder(orderId: number, dtos: (CreateChildOrderMenuItemDto | UpdateOrderMenuItemDto)[]): this {
        const enrichedDtos = dtos.map(dto => ({
            ...dto,
            orderId,
        }));
        return this.setPropByBuilder(this.itemBuilder.buildManyChildDto.bind(this.itemBuilder), 'orderedItems', this.entity, enrichedDtos);
    }

    public weeklyFulfillment(day: string | null): this {
        if (day === null) {
            return this.setPropByVal('weeklyFulfillment', null);
        }
        return this.setPropByVal('weeklyFulfillment', day);
    }

    public fulfillmentContactName(name: string | null): this {
        if (name === null) {
            return this.setPropByVal('fulfillmentContactName', null);
        }
        return this.setPropByVal('fulfillmentContactName', name);
    }
}