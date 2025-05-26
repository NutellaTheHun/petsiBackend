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
        query
            .leftJoin('entity.orderedItems', 'orderedItem')
            .leftJoin('orderedItem.menuItem', 'menuItem') // 👈 now menuItem alias is correctly defined
            .andWhere(
                `(LOWER(entity.recipient) LIKE :search OR LOWER(menuItem.itemName) LIKE :search)`,
                { search: `%${search.toLowerCase()}%` },
            );
    }

    protected applyFilters(query: SelectQueryBuilder<Order>, filters: Record<string, string>): void {
        if (filters.category) {
            query.andWhere('entity.orderCategory = :category', { category: filters.category });
        }
    }

    protected applyDate(query: SelectQueryBuilder<Order>, startDate: string, endDate?: string, dateBy?: string): void {
        if (dateBy === 'createdAt' || dateBy === 'fulfillmentDate') {
            query.andWhere(`DATE(entity.${dateBy}) >= :startDate`, { startDate });

            if (endDate) {
                query.andWhere(`DATE(entity.${dateBy}) <= :endDate`, { endDate });
            }
        }
    }
}