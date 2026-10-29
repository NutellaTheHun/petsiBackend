import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SquareOrderLink } from '../../square/entities/square-order-link.entity';
import { SquareUnresolvedLine } from '../../square/entities/square-unresolved-line.entity';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { ValidationException } from '../../../common/validation/validation-exception';
import { RequestContextService } from '../../request-context/RequestContextService';
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
 * Reads the Square link state of orders for `OrderResponseDto`, and guards
 * the Square-owned data of linked orders. Reads the
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
        private readonly requestContext: RequestContextService,
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

    /**
     * The ids of the order's Square-derived items, or null when the order
     * isn't linked to Square (never imported, or detached).
     */
    async squareLineIds(orderId: number): Promise<Set<number> | null> {
        const link = await this.orderLinkRepo.findOne({
            where: { orderId, status: 'linked' },
            select: { id: true, lineMap: true },
        });
        return link ? new Set(Object.values(link.lineMap).flat()) : null;
    }

    /**
     * Rejects a staff change, outside the order update path, to Square-owned
     * data of a linked order: removing a Square-derived item (or one of its
     * contents) when `orderMenuItemId` is given, otherwise any change to the
     * order (revert). Square's own writers set `squareSystemWriter`.
     */
    async assertNotSquareOwned(
        orderId: number,
        orderMenuItemId?: number,
    ): Promise<void> {
        if (this.requestContext.get<boolean>('squareSystemWriter')) return;
        const squareLineIds = await this.squareLineIds(orderId);
        if (
            !squareLineIds ||
            (orderMenuItemId !== undefined &&
                !squareLineIds.has(orderMenuItemId))
        ) {
            return;
        }
        const errorMap = new ValidationErrorMap(orderMenuItemId ?? orderId);
        errorMap.addError('IMMUTABLE_FIELD');
        throw new ValidationException(errorMap);
    }

    async forOrder(orderId: number): Promise<OrderSquareStatus> {
        return (
            (await this.forOrders([orderId])).get(orderId) ?? NO_SQUARE_STATUS
        );
    }
}
