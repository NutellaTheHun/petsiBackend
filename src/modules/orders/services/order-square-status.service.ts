import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SquareOrderLink } from '../../square/entities/square-order-link.entity';
import { SquareUnresolvedLine } from '../../square/entities/square-unresolved-line.entity';
import { OrderSquareUnresolvedLineDto } from '../dto/order/order-square-unresolved-line.dto';

export interface OrderSquareStatus {
    squareLinked: boolean;
    unresolvedSquareLines: OrderSquareUnresolvedLineDto[];
}

export const NO_SQUARE_STATUS: OrderSquareStatus = {
    squareLinked: false,
    unresolvedSquareLines: [],
};

/**
 * Reads the Square link state of orders for `OrderResponseDto`. Reads the
 * Square tables directly (not through `SquareModule`, which imports this
 * module). Callers pass orders they've already loaded through the scoped
 * `OrderService`, so no tenant or location check is repeated here.
 */
@Injectable()
export class OrderSquareStatusService {
    constructor(
        @InjectRepository(SquareOrderLink)
        private readonly orderLinkRepo: Repository<SquareOrderLink>,
        @InjectRepository(SquareUnresolvedLine)
        private readonly unresolvedLineRepo: Repository<SquareUnresolvedLine>,
    ) {}

    async forOrders(
        orderIds: number[],
    ): Promise<Map<number, OrderSquareStatus>> {
        const result = new Map<number, OrderSquareStatus>();
        if (!orderIds.length) {
            return result;
        }
        const [links, lines] = await Promise.all([
            this.orderLinkRepo.find({
                where: { orderId: In(orderIds), status: 'linked' },
                select: { id: true, orderId: true },
            }),
            this.unresolvedLineRepo.find({
                where: { orderId: In(orderIds), status: 'pending' },
                order: { id: 'ASC' },
            }),
        ]);
        const get = (orderId: number) => {
            let status = result.get(orderId);
            if (!status) {
                status = { squareLinked: false, unresolvedSquareLines: [] };
                result.set(orderId, status);
            }
            return status;
        };
        for (const link of links) {
            if (link.orderId == null) continue;
            get(link.orderId).squareLinked = true;
        }
        for (const line of lines) {
            if (line.orderId == null) continue;
            get(line.orderId).unresolvedSquareLines.push({
                id: line.id,
                squareLineUid: line.squareLineUid,
                squareVariationId: line.squareVariationId,
                squareItemName: line.squareItemName,
                squareVariationName: line.squareVariationName,
                squareModifiers: line.squareModifiers,
                reason: line.reason,
                quantity: line.quantity,
                note: line.note,
            });
        }
        return result;
    }

    async forOrder(orderId: number): Promise<OrderSquareStatus> {
        return (
            (await this.forOrders([orderId])).get(orderId) ?? NO_SQUARE_STATUS
        );
    }
}
