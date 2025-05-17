import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { OrderCategory } from "../entities/order-category.entity";
import { CreateOrderCategoryDto } from "../dto/create-order-category.dto";
import { UpdateOrderCategoryDto } from "../dto/update-order-category.dto";
import { OrderMenuItemComponent } from "../entities/order-menu-item-component.entity";
import { CreateOrderMenuItemComponentDto } from "../dto/create-order-menu-item-component.dto";
import { UpdateOrderMenuItemComponentDto } from "../dto/update-order-menu-item-component.dto";

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