import { BadRequestException, forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { OrderMenuItemBuilder } from "../builders/order-menu-item.builder";
import { CreateOrderMenuItemDto } from "../dto/order-menu-item/create-order-menu-item.dto";
import { OrderMenuItem } from "../entities/order-menu-item.entity";
import { Order } from "../entities/order.entity";

@Injectable()
export class OrderMenuItemService extends ServiceBase<OrderMenuItem> {
    constructor(
        @InjectRepository(OrderMenuItem)
        repo: Repository<OrderMenuItem>,

        @Inject(forwardRef(() => OrderMenuItemBuilder))
        builder: OrderMenuItemBuilder,

        requestContextService: RequestContextService,
        logger: AppLogger,
    ) { super(repo, builder, 'OrderMenuItemService', requestContextService, logger) }

    /**
     * Depreciated, only created as a child through {@link Order}.
     */
    public async create(dto: CreateOrderMenuItemDto): Promise<OrderMenuItem> {
        throw new BadRequestException();
    }
}