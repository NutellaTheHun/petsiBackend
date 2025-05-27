import { Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { CreateOrderCategoryDto } from "../dto/order-category/create-order-category.dto";
import { UpdateOrderCategoryDto } from "../dto/order-category/update-order-category.dto";
import { OrderCategory } from "../entities/order-category.entity";
import { OrderCategoryValidator } from "../validators/order-category.validator";

@Injectable()
export class OrderCategoryBuilder extends BuilderBase<OrderCategory> {
    constructor(
        validator: OrderCategoryValidator,
        requestContextService: RequestContextService,
        logger: AppLogger,
    ) { super(OrderCategory, 'OrderCategoryBuilder', requestContextService, logger, validator); }

    protected createEntity(dto: CreateOrderCategoryDto): void {
        if (dto.categoryName !== undefined) {
            this.name(dto.categoryName);
        }
    }

    protected updateEntity(dto: UpdateOrderCategoryDto): void {
        if (dto.categoryName !== undefined) {
            this.name(dto.categoryName);
        }
    }

    public name(name: string): this {
        return this.setPropByVal('categoryName', name);
    }
}