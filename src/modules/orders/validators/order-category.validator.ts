import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { OrderCategory } from "../entities/order-category.entity";
import { CreateOrderCategoryDto } from "../dto/create-order-category.dto";
import { UpdateOrderCategoryDto } from "../dto/update-order-category.dto";

@Injectable()
export class OrderCategoryValidator extends ValidatorBase<OrderCategory> {
    constructor(
        @InjectRepository(OrderCategory)
        private readonly repo: Repository<OrderCategory>,
    ){ super(repo); }

    public async validateCreate(dto: CreateOrderCategoryDto): Promise<string | null> {
        const exists = await this.repo.findOne({ where: { name: dto.name }});
        if(exists) { 
            return `Order type with name ${dto.name} already exists`; 
        }
        return null;
    }
    public async validateUpdate(dto: UpdateOrderCategoryDto): Promise<string | null> {
        return null;
    }
}