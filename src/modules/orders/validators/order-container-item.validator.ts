import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { CreateOrderContainerItemDto } from "../dto/order-container-item/create-order-container-item.dto";
import { UpdateOrderContainerItemDto } from "../dto/order-container-item/update-order-container-item.dto";
import { OrderContainerItem } from "../entities/order-container-item.entity";

@Injectable()
export class OrderContainerItemValidator extends ValidatorBase<OrderContainerItem> {
    constructor(
        @InjectRepository(OrderContainerItem)
        private readonly repo: Repository<OrderContainerItem>,
    ){ super(repo); }

    public async validateCreate(dto: CreateOrderContainerItemDto): Promise<string | null> {
        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateOrderContainerItemDto): Promise<string | null> {
        return null;
    }
}