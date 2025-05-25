import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { OrderBuilder } from "../builders/order.builder";
import { Order } from "../entities/order.entity";

@Injectable()
export class OrderService extends ServiceBase<Order> {
    constructor(
        @InjectRepository(Order)
        repo: Repository<Order>,

        @Inject(forwardRef(() => OrderBuilder))
        builder: OrderBuilder,

        requestContextService: RequestContextService,
        logger: AppLogger,
    ) { super(repo, builder, 'OrderService', requestContextService, logger) }

    protected applySearch(query: SelectQueryBuilder<Order>, search: string): void {
        query.leftJoin('entity.items', 'item');
        query.andWhere(`
        LOWER(entity.recipientName) LIKE :search
        OR LOWER(entity.orderCategory) LIKE :search
        OR LOWER(item.name) LIKE :search
    `, { search: `%${search.toLowerCase()}%` });
    }
}