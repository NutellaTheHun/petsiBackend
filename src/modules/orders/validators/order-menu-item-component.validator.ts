import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { CreateOrderMenuItemComponentDto } from "../dto/order-menu-item-component/create-order-menu-item-component.dto";
import { UpdateOrderMenuItemComponentDto } from "../dto/order-menu-item-component/update-order-menu-item-component.dto";
import { OrderMenuItemComponent } from "../entities/order-menu-item-component.entity";

@Injectable()
export class OrderMenuItemComponentValidator extends ValidatorBase<OrderMenuItemComponent> {
    constructor(
        @InjectRepository(OrderMenuItemComponent)
        private readonly repo: Repository<OrderMenuItemComponent>,
    ){ super(repo); }

    public async validateCreate(dto: CreateOrderMenuItemComponentDto): Promise<string | null> {
        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateOrderMenuItemComponentDto): Promise<string | null> {
        return null;
    }
}