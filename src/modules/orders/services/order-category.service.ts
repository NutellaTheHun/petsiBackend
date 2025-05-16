import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { OrderCategoryBuilder } from "../builders/order-category.builder";
import { OrderCategory } from "../entities/order-category.entity";
import { OrderCategoryValidator } from "../validators/order-category.validator";

@Injectable()
export class OrderCategoryService extends ServiceBase<OrderCategory> {
    constructor(
        @InjectRepository(OrderCategory)
        private readonly orderTypeRepo: Repository<OrderCategory>,
        typeBuilder: OrderCategoryBuilder,
        validator: OrderCategoryValidator,
        requestContextService: RequestContextService,
        logger: AppLogger,
    ){ super(orderTypeRepo, typeBuilder, validator, 'OrderTypeService', requestContextService, logger)}

    async findOneByName(name: string, relations?: Array<keyof OrderCategory>): Promise<OrderCategory | null> {
        return this.orderTypeRepo.findOne({ where: {name: name }, relations});
    }
}