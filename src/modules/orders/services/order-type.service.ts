import { Injectable, NotImplementedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { OrderType } from "../entities/order-type.entity";
import { CreateOrderTypeDto } from "../dto/create-order-type.dto";
import { UpdateOrderTypeDto } from "../dto/update-order-type.dto";

@Injectable()
export class OrderTypeService extends ServiceBase<OrderType> {
    constructor(
        @InjectRepository(OrderType)
        private readonly orderTypeRepo: Repository<OrderType>
    ){ super(orderTypeRepo)}

    async create(createDto: CreateOrderTypeDto): Promise<OrderType | null> {
        throw new NotImplementedException();
    }

    async update(id: number, updateDto: UpdateOrderTypeDto): Promise<OrderType | null>{
        throw new NotImplementedException();
    }

    async findOneByName(name: string, relations?: Array<keyof OrderType>): Promise<OrderType | null> {
            return this.orderTypeRepo.findOne({ where: {name: name }, relations});
    }
}