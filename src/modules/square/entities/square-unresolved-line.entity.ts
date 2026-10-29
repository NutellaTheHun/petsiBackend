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

export const SQUARE_UNRESOLVED_LINE_REASONS = [
    'unmapped_variation',
    'unmapped_modifier',
    'ad_hoc',
    'container_invalid',
] as const;

export type SquareUnresolvedLineReason =
    (typeof SQUARE_UNRESOLVED_LINE_REASONS)[number];

export const SQUARE_UNRESOLVED_LINE_STATUSES = [
    'pending',
    'resolved',
    'dismissed',
] as const;

export type SquareUnresolvedLineStatus =
    (typeof SQUARE_UNRESOLVED_LINE_STATUSES)[number];

/** The line's modifiers as Square sent them (no money). */
export interface SquareModifierSnapshot {
    squareModifierId: string | null;
    name: string | null;
    quantity: number;
}

/**
 * A Square line Petsi couldn't place on the order: shown as a placeholder on
 * the order and in the attention queue until it's resolved (converted into
 * order items) or dismissed. Never forced into an `OrderMenuItem`.
 */
@Entity()
@Unique(['tenantId', 'squareOrderId', 'squareLineUid'])
export class SquareUnresolvedLine {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    tenantId: number;

    @Column()
    locationId: number;

    @Column({ type: 'int', nullable: true })
    orderId: number | null;

    @ManyToOne(() => Order, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'orderId' })
    order?: Order | null;

    @Column()
    squareOrderId: string;

    @Column()
    squareLineUid: string;

    /** Null for ad-hoc lines (no `catalogObjectId`). */
    @Column({ type: 'varchar', nullable: true })
    squareVariationId: string | null;

    @Column({ type: 'varchar', nullable: true })
    squareItemName: string | null;

    @Column({ type: 'varchar', nullable: true })
    squareVariationName: string | null;

    @Column({ type: 'jsonb', default: [] })
    squareModifiers: SquareModifierSnapshot[];

    @Column({
        type: 'enum',
        enum: SQUARE_UNRESOLVED_LINE_REASONS,
        enumName: 'square_unresolved_line_reason',
    })
    reason: SquareUnresolvedLineReason;

    @Column()
    quantity: number;

    @Column({ type: 'varchar', nullable: true })
    note: string | null;

    @Column({
        type: 'enum',
        enum: SQUARE_UNRESOLVED_LINE_STATUSES,
        enumName: 'square_unresolved_line_status',
        default: 'pending',
    })
    status: SquareUnresolvedLineStatus;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
