import { Injectable, NotImplementedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { Order } from "../entities/order.entity";
import { CreateOrderDto } from "../dto/create-order.dto";
import { UpdateOrderDto } from "../dto/update-order.dto";

@Injectable()
export class OrderService extends ServiceBase<Order> {
    constructor(
        @InjectRepository(Order)
        private readonly orderRepo: Repository<Order>
    ){ super(orderRepo)}

    async create(createDto: CreateOrderDto): Promise<Order | null> {
        throw new NotImplementedException();
    }
    
    async update(id: number, updateDto: UpdateOrderDto): Promise<Order | null>{
        throw new NotImplementedException();
    }
}