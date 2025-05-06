import { forwardRef, Inject, Injectable, NotFoundException, NotImplementedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { OrderMenuItem } from "../entities/order-menu-item.entity";
import { CreateOrderMenuItemDto } from "../dto/create-order-menu-item.dto";
import { UpdateOrderMenuItemDto } from "../dto/update-order-menu-item.dto";
import { OrderMenuItemBuilder } from "../builders/order-menu-item.builder";
import { OrderService } from "./order.service";
import { OrderMenuItemValidator } from "../validators/order-menu-item.validator";

@Injectable()
export class OrderMenuItemService extends ServiceBase<OrderMenuItem> {
    constructor(
        @InjectRepository(OrderMenuItem)
        private readonly orderItemRepo: Repository<OrderMenuItem>,
        
        @Inject(forwardRef(() => OrderMenuItemBuilder))
        private readonly itemBuilder: OrderMenuItemBuilder,

        @Inject(forwardRef(() => OrderService))
        private readonly orderService: OrderService,

        validator: OrderMenuItemValidator,
    ){ super(orderItemRepo, itemBuilder, validator, 'OrderMenuItemService')}

    async create(dto: CreateOrderMenuItemDto): Promise<OrderMenuItem | null> {
        //const parentOrder = await this.orderService.findOne(dto.orderId);
        //if(!parentOrder){ throw new NotFoundException(); }
        
        const oType = await this.itemBuilder.buildCreateDto(/*parentOrder,*/ dto);
        return await this.orderItemRepo.save(oType);
    }

    async update(id: number, dto: UpdateOrderMenuItemDto): Promise<OrderMenuItem | null>{
        const toUpdate = await this.findOne(id);
        if(!toUpdate){ return null; }

        await this.itemBuilder.buildUpdateDto(toUpdate, dto);
        return await this.orderItemRepo.save(toUpdate);
    }
}