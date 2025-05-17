import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { Order } from "../entities/order.entity";
import { CreateOrderDto } from "../dto/create-order.dto";
import { UpdateOrderDto } from "../dto/update-order.dto";

@Injectable()
export class OrderValidator extends ValidatorBase<Order> {
    constructor(
        @InjectRepository(Order)
        private readonly repo: Repository<Order>,
    ){ super(repo); }

    public async validateCreate(dto: CreateOrderDto): Promise<string | null> {
        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateOrderDto): Promise<string | null> {
        return null;
    }
}