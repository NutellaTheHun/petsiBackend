import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { OrderCategory } from "../entities/order-category.entity";
import { CreateOrderCategoryDto } from "../dto/order-category/create-order-category.dto";
import { UpdateOrderCategoryDto } from "../dto/order-category/update-order-category.dto";

@Injectable()
export class OrderCategoryValidator extends ValidatorBase<OrderCategory> {
    constructor(
        @InjectRepository(OrderCategory)
        private readonly repo: Repository<OrderCategory>,
    ){ super(repo); }

    public async validateCreate(dto: CreateOrderCategoryDto): Promise<string | null> {
        const exists = await this.repo.findOne({ where: { categoryName: dto.categoryName }});
        if(exists) { 
            return `Order category with name ${dto.categoryName} already exists`; 
        }
        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateOrderCategoryDto): Promise<string | null> {
        if(dto.categoryName){
            const exists = await this.repo.findOne({ where: { categoryName: dto.categoryName }});
            if(exists) { 
                return `Order category with name ${dto.categoryName} already exists`; 
            } 
        }
        return null;
    }
}