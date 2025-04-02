import { Injectable, NotImplementedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { OrderMenuItem } from "../entities/order-menu-item.entity";
import { CreateOrderMenuItemDto } from "../dto/create-order-menu-item.dto";
import { UpdateOrderMenuItemDto } from "../dto/update-order-menu-item.dto";

@Injectable()
export class OrderMenuItemService extends ServiceBase<OrderMenuItem> {
    constructor(
        @InjectRepository(OrderMenuItem)
        private readonly orderItemRepo: Repository<OrderMenuItem>
    ){ super(orderItemRepo)}

    async create(createDto: CreateOrderMenuItemDto): Promise<OrderMenuItem | null> {
        throw new NotImplementedException();
    }

    async update(id: number, updateDto: UpdateOrderMenuItemDto): Promise<OrderMenuItem | null>{
        throw new NotImplementedException();
    }
}