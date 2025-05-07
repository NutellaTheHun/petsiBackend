import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { OrderType } from "../entities/order-type.entity";
import { Order } from "../entities/order.entity";

@Injectable()
export class OrderTypeValidator extends ValidatorBase<OrderType> {
    constructor(
        @InjectRepository(OrderType)
        private readonly repo: Repository<OrderType>,
    ){ super(repo); }

    public async validateCreate(dto: any): Promise<string | null> {
        const exists = await this.repo.findOne({ where: { name: dto.name }});
        if(exists) { 
            return `Order type with name ${dto.name} already exists`; 
        }
        return null;
    }
    public async validateUpdate(dto: any): Promise<string | null> {
        return null;
    }
}