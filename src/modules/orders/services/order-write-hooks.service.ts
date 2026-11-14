import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { EntityManager } from 'typeorm';
import { Order } from '../entities/order.entity';

/** Runs inside an order update's transaction, after the order is saved. */
export type OrderInTransactionHook = (
    manager: EntityManager,
    order: Order,
) => Promise<void>;

/** Runs after an update that unfroze the order has committed. */
export type OrderUnfrozenListener = (order: Order) => Promise<void>;

/**
 * Lets modules that depend on this one (the Square integration) take part in
 * order writes without this module depending on them:
 * - `runWithInTransactionHook` makes one order's update, made by `fn`, also
 *   run `hook` in its transaction (so a caller's rows commit or roll back
 *   with the order);
 * - `onUnfrozen` listeners run after an update that sets `isFrozen` to false.
 */
@Injectable()
export class OrderWriteHooks {
    private readonly inTransaction = new AsyncLocalStorage<{
        orderId: number;
        hook: OrderInTransactionHook;
    }>();
    private readonly unfrozenListeners: OrderUnfrozenListener[] = [];

    runWithInTransactionHook<T>(
        orderId: number,
        hook: OrderInTransactionHook,
        fn: () => Promise<T>,
    ): Promise<T> {
        return this.inTransaction.run({ orderId, hook }, fn);
    }

    /** Called by `OrderService` inside every order update's transaction. */
    async runInTransaction(manager: EntityManager, order: Order) {
        const store = this.inTransaction.getStore();
        if (store?.orderId === order.id) {
            await store.hook(manager, order);
        }
    }

    onUnfrozen(listener: OrderUnfrozenListener): void {
        this.unfrozenListeners.push(listener);
    }

    /** Called by `OrderService` after an unfreezing update commits. */
    async emitUnfrozen(order: Order): Promise<void> {
        for (const listener of this.unfrozenListeners) {
            await listener(order);
        }
    }
}
