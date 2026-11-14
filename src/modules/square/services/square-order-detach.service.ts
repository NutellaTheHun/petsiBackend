import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { RequestContextService } from '../../request-context/RequestContextService';
import { SquareOrderLink } from '../entities/square-order-link.entity';
import { SquareUnresolvedLine } from '../entities/square-unresolved-line.entity';

/**
 * Hands an imported order to Petsi: the order link becomes `detached`, its
 * line map is cleared (so every line counts as staff-added and nothing is
 * locked) and the order's pending unresolved lines are dismissed. Ingest
 * ignores later Square events for a detached order.
 *
 * `RoleGuard` authorizes the caller for the route's `locationId`; an order
 * at another location, of another tenant, or not from Square is a 404.
 */
@Injectable()
export class SquareOrderDetachService {
    constructor(
        @InjectRepository(SquareOrderLink)
        private readonly orderLinkRepo: Repository<SquareOrderLink>,
        @InjectRepository(Order)
        private readonly orderRepo: Repository<Order>,
        private readonly requestContextService: RequestContextService,
    ) {}

    /** Detaching a detached order is a no-op. */
    async detachForCurrentTenant(
        locationId: number,
        orderId: number,
    ): Promise<void> {
        const tenantId = this.requestContextService.get<number>('tenantId');
        if (tenantId == null) {
            throw new NotFoundException();
        }
        const order = await this.orderRepo.findOne({
            where: { id: orderId, tenantId, locationId },
            select: { id: true },
            loadEagerRelations: false,
        });
        const link = order
            ? await this.orderLinkRepo.findOne({
                  where: { tenantId, orderId },
              })
            : null;
        if (!link) {
            throw new NotFoundException();
        }
        if (link.status === 'detached') {
            return;
        }

        await this.orderLinkRepo.manager.transaction(async (manager) => {
            await manager.update(
                SquareOrderLink,
                { id: link.id },
                { status: 'detached', lineMap: {} },
            );
            await manager.update(
                SquareUnresolvedLine,
                {
                    tenantId,
                    squareOrderId: link.squareOrderId,
                    status: 'pending',
                },
                { status: 'dismissed' },
            );
        });
    }
}
