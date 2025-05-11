import { Injectable } from "@nestjs/common";
import { OrderType } from "../entities/order-type.entity";
import { BuilderBase } from "../../../base/builder-base";
import { CreateOrderTypeDto } from "../dto/create-order-type.dto";
import { UpdateOrderTypeDto } from "../dto/update-order-type.dto";
import { OrderTypeValidator } from "../validators/order-type.validator";

@Injectable()
export class OrderTypeBuilder extends BuilderBase<OrderType>{
    constructor(
        validator: OrderTypeValidator,
    ){ super(OrderType, validator); }

    protected async createEntity(dto: CreateOrderTypeDto): Promise<void> {
        if(dto.name){
            this.name(dto.name);
        }
    }

    protected async updateEntity(dto: UpdateOrderTypeDto): Promise<void> {
        if(dto.name){
            this.name(dto.name);
        }
    }

    public name(name: string): this {
        return this.setProp('name', name);
    }
/*
    public async buildCreateDto(dto: CreateOrderTypeDto): Promise<OrderType> {
        this.reset();

        if(dto.name){
            this.name(dto.name);
        }

        return await this.build();
    }

    public async buildUpdateDto(otype: OrderType, dto: UpdateOrderTypeDto): Promise<OrderType> {
        this.reset();
        this.setEntity(otype);
        
        if(dto.name){
            this.name(dto.name);
        }

        return await this.build();
    }*/
}