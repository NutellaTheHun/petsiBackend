import { Injectable, NotImplementedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { OrderType } from "../entities/order-type.entity";
import { CreateOrderTypeDto } from "../dto/create-order-type.dto";
import { UpdateOrderTypeDto } from "../dto/update-order-type.dto";
import { OrderTypeBuilder } from "../builders/order-type.builder";

@Injectable()
export class OrderTypeService extends ServiceBase<OrderType> {
    constructor(
        @InjectRepository(OrderType)
        private readonly orderTypeRepo: Repository<OrderType>,
        private readonly typeBuilder: OrderTypeBuilder,
    ){ super(orderTypeRepo, typeBuilder, 'OrderTypeService')}

    async create(dto: CreateOrderTypeDto): Promise<OrderType | null> {
        const exists = await this.findOneByName(dto.name);
        if(exists) { return null; }
        
        const oType = await this.typeBuilder.buildCreateDto(dto);
        return await this.orderTypeRepo.save(oType);
    }

    async update(id: number, dto: UpdateOrderTypeDto): Promise<OrderType | null>{
        const toUpdate = await this.findOne(id);
        if(!toUpdate){ return null; }

        await this.typeBuilder.buildUpdateDto(toUpdate, dto);
        return await this.orderTypeRepo.save(toUpdate);
    }

    async findOneByName(name: string, relations?: Array<keyof OrderType>): Promise<OrderType | null> {
        return this.orderTypeRepo.findOne({ where: {name: name }, relations});
    }
}