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
import { ValidationErrorResponse } from '../../../common/validation/validation-error';
import { Order } from '../../orders/entities/order.entity';

export const SQUARE_ORDER_ISSUE_REASONS = [
    'validation_failed',
    'location_unmapped',
    'refund_received',
    'cancelled_while_detached',
] as const;

export type SquareOrderIssueReason =
    (typeof SQUARE_ORDER_ISSUE_REASONS)[number];

/** Reasons a later ingest of the order can fix, so a success resolves them. */
export const SQUARE_RETRYABLE_ISSUE_REASONS: readonly SquareOrderIssueReason[] =
    ['validation_failed', 'location_unmapped'];

export const SQUARE_ORDER_ISSUE_STATUSES = [
    'open',
    'resolved',
    'dismissed',
] as const;

export type SquareOrderIssueStatus =
    (typeof SQUARE_ORDER_ISSUE_STATUSES)[number];

/**
 * What went wrong, in Petsi's terms. Never a raw Square body, recipient data
 * or tenders: a validation tree carries only error codes, ids and field names.
 */
export interface SquareOrderIssueDetail {
    /** The order validator's client-facing tree (`validation_failed`). */
    validationErrors?: ValidationErrorResponse;
}

/**
 * One row per Square order that needs a person at the order level: Petsi
 * rejected it, or it can't be placed at a Petsi location. No order is created
 * for it and nothing is invented. Retried by the next Square update, a manual
 * retry or a re-sync; a successful ingest resolves it.
 */
@Entity()
@Unique(['tenantId', 'squareOrderId'])
export class SquareOrderIssue {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    tenantId: number;

    @Column()
    squareLocationId: string;

    /**
     * The Petsi location the order belongs to, for location-scoped access:
     * the location link's, or the existing order's. Null when neither exists
     * (a `location_unmapped` order never imported), so only tenant admins
     * can reach it.
     */
    @Column({ type: 'int', nullable: true })
    locationId: number | null;

    @Column()
    squareOrderId: string;

    /** Null until the order exists in Petsi. */
    @Column({ type: 'int', nullable: true })
    orderId: number | null;

    @ManyToOne(() => Order, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'orderId' })
    order?: Order | null;

    /** The Square order version last attempted (a bigint, read as a string). */
    @Column({ type: 'bigint' })
    squareVersion: string;

    @Column({
        type: 'enum',
        enum: SQUARE_ORDER_ISSUE_REASONS,
        enumName: 'square_order_issue_reason',
    })
    reason: SquareOrderIssueReason;

    @Column({ type: 'jsonb', nullable: true })
    detail: SquareOrderIssueDetail | null;

    @Column({
        type: 'enum',
        enum: SQUARE_ORDER_ISSUE_STATUSES,
        enumName: 'square_order_issue_status',
        default: 'open',
    })
    status: SquareOrderIssueStatus;

    @Column({ type: 'timestamptz' })
    lastAttemptAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
