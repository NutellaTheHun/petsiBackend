import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { OrderCategory } from '../../orders/entities/order-category.entity';

export const SQUARE_CONNECTION_STATUSES = [
    'connected',
    'needs_reauth',
    'disconnected',
] as const;

export type SquareConnectionStatus =
    (typeof SQUARE_CONNECTION_STATUSES)[number];

/**
 * A tenant's OAuth link to one Square seller. One per tenant, and a Square
 * merchant can belong to only one tenant (webhooks are routed by merchant id).
 *
 * Never returned from an endpoint: the tokens must not reach any response,
 * DTO, log or revision snapshot. Map to `SquareConnectionStatusDto` instead.
 */
@Entity()
export class SquareConnection {
    @PrimaryGeneratedColumn()
    id: number;

    /** Denormalized scalar column (not a relation), like other tenant-scoped entities. */
    @Column({ unique: true })
    tenantId: number;

    @Column({ unique: true })
    merchantId: string;

    @Column({ type: 'varchar', nullable: true })
    businessName: string | null;

    /** Encrypted by `SquareTokenCryptoService`; null once disconnected. */
    @Column({ type: 'text', nullable: true })
    accessToken: string | null;

    @Column({ type: 'timestamptz', nullable: true })
    accessTokenExpiresAt: Date | null;

    /** Encrypted by `SquareTokenCryptoService`; null once disconnected. */
    @Column({ type: 'text', nullable: true })
    refreshToken: string | null;

    @Column({ type: 'text', array: true, default: '{}' })
    scopes: string[];

    @Column({
        type: 'enum',
        enum: SQUARE_CONNECTION_STATUSES,
        enumName: 'square_connection_status',
    })
    status: SquareConnectionStatus;

    /**
     * The `latestTime` cursor from the last `catalog.search`, kept as Square's
     * RFC 3339 string so it round-trips exactly as the next `beginTime`.
     */
    @Column({ type: 'varchar', nullable: true })
    catalogSyncedAt: string | null;

    @Column({ type: 'int', nullable: true })
    defaultOrderCategoryId: number | null;

    @ManyToOne(() => OrderCategory, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'defaultOrderCategoryId' })
    defaultOrderCategory?: OrderCategory | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
