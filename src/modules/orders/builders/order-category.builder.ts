import { Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { RequestContextService } from "../../request-context/RequestContextService";
import { AppLogger } from "../../app-logging/app-logger";
import { CreateOrderCategoryDto } from "../dto/create-order-category.dto";
import { UpdateOrderCategoryDto } from "../dto/update-order-category.dto";
import { OrderCategory } from "../entities/order-category.entity";
import { OrderCategoryValidator } from "../validators/order-category.validator";

@Injectable()
export class OrderCategoryBuilder extends BuilderBase<OrderCategory>{
    constructor(
        validator: OrderCategoryValidator,
        requestContextService: RequestContextService,
        logger: AppLogger,
    ){ super(OrderCategory, 'OrderTypeBuilder',  requestContextService, logger, validator); }

    protected createEntity(dto: CreateOrderCategoryDto): void {
        if(dto.name){
            this.name(dto.name);
        }
    }

    protected updateEntity(dto: UpdateOrderCategoryDto): void {
        if(dto.name){
            this.name(dto.name);
        }
    }

    public name(name: string): this {
        return this.setPropByVal('name', name);
    }
}