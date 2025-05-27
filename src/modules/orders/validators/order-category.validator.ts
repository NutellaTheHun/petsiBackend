import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { ValidationError } from "../../../util/exceptions/validation-error";
import { CreateOrderCategoryDto } from "../dto/order-category/create-order-category.dto";
import { UpdateOrderCategoryDto } from "../dto/order-category/update-order-category.dto";
import { OrderCategory } from "../entities/order-category.entity";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";

@Injectable()
export class OrderCategoryValidator extends ValidatorBase<OrderCategory> {
    constructor(
        @InjectRepository(OrderCategory)
        private readonly repo: Repository<OrderCategory>,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ) { super(repo, 'OrderCategory', requestContextService, logger); }

    public async validateCreate(dto: CreateOrderCategoryDto): Promise<void> {
        if (await this.helper.exists(this.repo, 'categoryName', dto.categoryName)) {
            this.addError({
                errorMessage: 'Order category already exists.',
                errorType: 'EXIST',
                contextEntity: 'CreateOrderCategoryDto',
                sourceEntity: 'OrderCategory',
                value: dto.categoryName,
            } as ValidationError);
        }

        this.throwIfErrors()
    }

    public async validateUpdate(id: number, dto: UpdateOrderCategoryDto): Promise<void> {
        if (dto.categoryName) {
            if (await this.helper.exists(this.repo, 'categoryName', dto.categoryName)) {
                this.addError({
                    errorMessage: 'Order category already exists.',
                    errorType: 'EXIST',
                    contextEntity: 'UpdateOrderCategoryDto',
                    contextId: id,
                    sourceEntity: 'OrderCategory',
                    value: dto.categoryName,
                } as ValidationError);
            }
        }

        this.throwIfErrors()
    }
}