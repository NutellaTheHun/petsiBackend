import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { RequestContextService } from "../../request-context/RequestContextService";
import { AppLogger } from "../../app-logging/app-logger";
import { OrderMenuItemBuilder } from "../builders/order-menu-item.builder";
import { OrderMenuItem } from "../entities/order-menu-item.entity";
import { OrderMenuItemValidator } from "../validators/order-menu-item.validator";

@Injectable()
export class OrderMenuItemService extends ServiceBase<OrderMenuItem> {
    constructor(
        @InjectRepository(OrderMenuItem)
        orderItemRepo: Repository<OrderMenuItem>,
        
        @Inject(forwardRef(() => OrderMenuItemBuilder))
        itemBuilder: OrderMenuItemBuilder,
        
        @Inject(forwardRef(() => OrderMenuItemValidator))
        validator: OrderMenuItemValidator,
        
        requestContextService: RequestContextService,
        logger: AppLogger,
    ){ super(orderItemRepo, itemBuilder, validator, 'OrderMenuItemService', requestContextService, logger)}
}