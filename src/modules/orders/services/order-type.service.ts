import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { OrderTypeBuilder } from "../builders/order-type.builder";
import { OrderType } from "../entities/order-type.entity";
import { OrderTypeValidator } from "../validators/order-type.validator";
import { RequestContextService } from "../../request-context/RequestContextService";
import { ModuleRef } from "@nestjs/core";
import { AppLogger } from "../../app-logging/app-logger";

@Injectable()
export class OrderTypeService extends ServiceBase<OrderType> {
    constructor(
        @InjectRepository(OrderType)
        private readonly orderTypeRepo: Repository<OrderType>,
        typeBuilder: OrderTypeBuilder,
        validator: OrderTypeValidator,
        requestContextService: RequestContextService,
        logger: AppLogger,
    ){ super(orderTypeRepo, typeBuilder, validator, 'OrderTypeService', requestContextService, logger)}

    async findOneByName(name: string, relations?: Array<keyof OrderType>): Promise<OrderType | null> {
        return this.orderTypeRepo.findOne({ where: {name: name }, relations});
    }
}