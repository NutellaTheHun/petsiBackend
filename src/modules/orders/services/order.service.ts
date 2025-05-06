import { forwardRef, Inject, Injectable, NotImplementedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { Order } from "../entities/order.entity";
import { CreateOrderDto } from "../dto/create-order.dto";
import { UpdateOrderDto } from "../dto/update-order.dto";
import { OrderBuilder } from "../builders/order.builder";
import { OrderValidator } from "../validators/order.validator";

@Injectable()
export class OrderService extends ServiceBase<Order> {
    constructor(
        @InjectRepository(Order)
        private readonly orderRepo: Repository<Order>,
        
        @Inject(forwardRef(() => OrderBuilder))
        private readonly orderBuilder: OrderBuilder,
        
        validator: OrderValidator,
    ){ super(orderRepo, orderBuilder, validator, 'OrderService')}

    async create(dto: CreateOrderDto): Promise<Order | null> {
        const order = await this.orderBuilder.buildCreateDto(dto);
        return await this.orderRepo.save(order);
    }
    
    async update(id: number, dto: UpdateOrderDto): Promise<Order | null>{
        const toUpdate = await this.findOne(id);
        if(!toUpdate){ return null; }

        await this.orderBuilder.buildUpdateDto(toUpdate, dto);
        return await this.orderRepo.save(toUpdate);
    }
}