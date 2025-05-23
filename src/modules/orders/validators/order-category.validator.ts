import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { OrderCategory } from "../entities/order-category.entity";
import { CreateOrderCategoryDto } from "../dto/order-category/create-order-category.dto";
import { UpdateOrderCategoryDto } from "../dto/order-category/update-order-category.dto";
import { ValidationError } from "../../../util/exceptions/validationError";

@Injectable()
export class OrderCategoryValidator extends ValidatorBase<OrderCategory> {
    constructor(
        @InjectRepository(OrderCategory)
        private readonly repo: Repository<OrderCategory>,
    ){ super(repo); }

    public async validateCreate(dto: CreateOrderCategoryDto): Promise<ValidationError[]> {
        if(await this.helper.exists(this.repo, 'categoryName', dto.categoryName)) { 
            this.addError({
                error: 'Order category already exists.',
                status: 'EXIST',
                contextEntity: 'CreateOrderCategoryDto',
                sourceEntity: 'OrderCategory',
                value: dto.categoryName,
            } as ValidationError);
        }
        
        return this.errors;
    }
    
    public async validateUpdate(id: number, dto: UpdateOrderCategoryDto): Promise<ValidationError[]> {
        if(dto.categoryName){
            if(await this.helper.exists(this.repo, 'categoryName', dto.categoryName)) { 
                this.addError({
                    error: 'Order category already exists.',
                    status: 'EXIST',
                    contextEntity: 'UpdateOrderCategoryDto',
                    contextId: id,
                    sourceEntity: 'OrderCategory',
                    value: dto.categoryName,
                } as ValidationError);
            }
        }

        return this.errors;
    }
}