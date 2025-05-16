import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { RequestContextService } from "../../request-context/RequestContextService";
import { AppLogger } from "../../app-logging/app-logger";
import { CreateChildOrderMenuItemDto } from "../dto/create-child-order-menu-item.dto";
import { CreateOrderDto } from "../dto/create-order.dto";
import { UpdateOrderMenuItemDto } from "../dto/update-order-menu-item.dto";
import { UpdateOrderDto } from "../dto/update-order.dto";
import { Order } from "../entities/order.entity";
import { OrderMenuItemService } from "../services/order-menu-item.service";
import { OrderCategoryService } from "../services/order-category.service";
import { OrderValidator } from "../validators/order.validator";
import { OrderMenuItemBuilder } from "./order-menu-item.builder";

@Injectable()
export class OrderBuilder extends BuilderBase<Order>{
    constructor(
        private readonly typeService: OrderCategoryService,

        @Inject(forwardRef(() => OrderMenuItemService))
        private readonly itemService: OrderMenuItemService,

        @Inject(forwardRef(() => OrderMenuItemBuilder))
        private readonly itemBuilder: OrderMenuItemBuilder,

        validator: OrderValidator,
        requestContextService: RequestContextService,
        logger: AppLogger,
    ){ super( Order, 'OrderBuilder', requestContextService, logger, validator); }

    protected createEntity(dto: CreateOrderDto): void {
        if(dto.deliveryAddress){
            this.deliveryAddress(dto.deliveryAddress);
        }
        if(dto.email){
            this.email(dto.email);
        }
        if(dto.fulfillmentDate){
            this.fulfillmentDate(dto.fulfillmentDate);
        }
        if(dto.fulfillmentType){
            this.fulfillmentType(dto.fulfillmentType);
        }
        if(dto.isFrozen){
            this.isFrozen(dto.isFrozen);
        }
        if(dto.isWeekly){
            this.isWeekly(dto.isWeekly);
        }
        if(dto.note){
            this.note(dto.note);
        }
        if(dto.orderMenuItemDtos){
            this.itemsByBuilder(this.entity.id, dto.orderMenuItemDtos)
        }
        if(dto.orderTypeId){
            this.orderTypeById(dto.orderTypeId);
        }
        if(dto.phoneNumber){
            this.phoneNumber(dto.phoneNumber);
        }
        if(dto.recipient){
            this.recipient(dto.recipient);
        }
        if(dto.weeklyFulfillment){
            this.weeklyFulfillment(dto.weeklyFulfillment);
        }
        if(dto.fulfillmentContactName){
            this.fulfillmentContactName(dto.fulfillmentContactName);
        }
    }

    protected updateEntity(dto: UpdateOrderDto): void {
        if(dto.deliveryAddress){
            this.deliveryAddress(dto.deliveryAddress);
        }
        if(dto.email){
            this.email(dto.email);
        }
        if(dto.fulfillmentDate){
            this.fulfillmentDate(dto.fulfillmentDate);
        }
        if(dto.fulfillmentType){
            this.fulfillmentType(dto.fulfillmentType);
        }
        if(dto.isFrozen){
            this.isFrozen(dto.isFrozen);
        }
        if(dto.isWeekly){
            this.isWeekly(dto.isWeekly);
        }
        if(dto.note){
            this.note(dto.note);
        }
        if(dto.orderMenuItemDtos){
            this.itemsByBuilder(this.entity.id, dto.orderMenuItemDtos)
        }
        if(dto.orderTypeId){
            this.orderTypeById(dto.orderTypeId);
        }
        if(dto.phoneNumber){
            this.phoneNumber(dto.phoneNumber);
        }
        if(dto.recipient){
            this.recipient(dto.recipient);
        }
        if(dto.weeklyFulfillment){
            this.weeklyFulfillment(dto.weeklyFulfillment);
        }
        if(dto.fulfillmentContactName){
            this.fulfillmentContactName(dto.fulfillmentContactName);
        }
    }

    public orderTypeById(id: number): this {
        return this.setPropById(this.typeService.findOne.bind(this.typeService), 'type', id);
    }

    public orderTypeByName(name: string): this {
        return this.setPropByName(this.typeService.findOneByName.bind(this.typeService), 'type', name);
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

    public deliveryAddress(address: string): this {
        return this.setPropByVal('deliveryAddress', address);
    }

    public phoneNumber(number: string): this {
        return this.setPropByVal('phoneNumber', number);
    }

    public email(email: string): this {
        return this.setPropByVal('email', email);
    }

    public note(note: string): this {
        return this.setPropByVal('note', note);
    }

    public isFrozen(val: boolean): this {
        return this.setPropByVal('isFrozen', val);
    }

    public isWeekly(val: boolean): this {
        return this.setPropByVal('isWeekly', val);
    }

    public itemsById(ids: number[]): this {
        return this.setPropsByIds(this.itemService.findEntitiesById.bind(this.itemService), 'items', ids);
    }

    public itemsByBuilder(orderId: number, dtos: (CreateChildOrderMenuItemDto | UpdateOrderMenuItemDto)[]): this {
        const enrichedDtos = dtos.map( dto => ({
            ...dto,
            orderId,
        }));
        return this.setPropByBuilder(this.itemBuilder.buildManyChildDto.bind(this.itemBuilder), 'items', this.entity, enrichedDtos);
    }

    public weeklyFulfillment(day: string): this {
        return this.setPropByVal('weeklyFulfillment', day);
    }

    public fulfillmentContactName(name: string): this {
        return this.setPropByVal('fulfillmentContactName', name);
    }
}