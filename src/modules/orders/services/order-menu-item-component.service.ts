import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { OrderMenuItemComponentBuilder } from "../builders/order-menu-item-component.builder";
import { OrderMenuItemComponent } from "../entities/order-menu-item-component.entity";
import { OrderMenuItemComponentValidator } from "../validators/order-menu-item-component.validator";

@Injectable()
export class OrderMenuItemComponentService extends ServiceBase<OrderMenuItemComponent> {
    constructor(
        @InjectRepository(OrderMenuItemComponent)
        repo: Repository<OrderMenuItemComponent>,
        typeBuilder: OrderMenuItemComponentBuilder,
        validator: OrderMenuItemComponentValidator,
        requestContextService: RequestContextService,
        logger: AppLogger,
    ){ super(repo, typeBuilder, validator, 'OrderMenuItemComponentService', requestContextService, logger)}
}