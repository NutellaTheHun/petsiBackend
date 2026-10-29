import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
    UpdateDateColumn,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';

export const SQUARE_ORDER_LINK_STATUSES = ['linked', 'detached'] as const;

export type SquareOrderLinkStatus = (typeof SQUARE_ORDER_LINK_STATUSES)[number];

/** Square line uid → the Petsi `OrderMenuItem` ids ingest created for it. */
export type SquareOrderLineMap = Record<string, number[]>;

/**
 * One row per imported Square order: the dedupe key, the stale-version check,
 * and (through `lineMap`) which of the Petsi order's lines are Square-derived.
 * Lines missing from `lineMap` were added by staff and ingest never touches
 * them. Skipped orders (out of scope, `DRAFT`, disabled location) get no row.
 */
@Entity()
@Unique(['tenantId', 'squareOrderId'])
export class SquareOrderLink {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    tenantId: number;

    @Column()
    squareOrderId: string;

    /** The last ingested Square order version (a bigint, read as a string). */
    @Column({ type: 'bigint' })
    squareVersion: string;

    @Column()
    squareLocationId: string;

    @Column({ type: 'int', nullable: true })
    orderId: number | null;

    @ManyToOne(() => Order, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'orderId' })
    order?: Order | null;

    @Column({
        type: 'enum',
        enum: SQUARE_ORDER_LINK_STATUSES,
        enumName: 'square_order_link_status',
        default: 'linked',
    })
    status: SquareOrderLinkStatus;

    @Column({ type: 'jsonb', default: {} })
    lineMap: SquareOrderLineMap;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
