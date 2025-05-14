import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { RequestContextService } from "../../request-context/RequestContextService";
import { AppLogger } from "../../app-logging/app-logger";
import { OrderBuilder } from "../builders/order.builder";
import { Order } from "../entities/order.entity";
import { OrderValidator } from "../validators/order.validator";

@Injectable()
export class OrderService extends ServiceBase<Order> {
    constructor(
        @InjectRepository(Order)
        orderRepo: Repository<Order>,
        
        @Inject(forwardRef(() => OrderBuilder))
        orderBuilder: OrderBuilder,
        
        validator: OrderValidator,
        requestContextService: RequestContextService,
        logger: AppLogger,
    ){ super(orderRepo, orderBuilder, validator, 'OrderService', requestContextService, logger)}
}