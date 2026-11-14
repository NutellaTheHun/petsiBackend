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
import { Location } from '../../locations/entities/location.entity';

/**
 * One row per Square location the tenant's seller has. The location sync
 * writes the Square-side fields (`squareName`, `squareStatus`, `timezone`);
 * `enabled` and `locationId` are the tenant's choices and a sync never
 * overwrites them. Several links may map to the same Petsi location.
 */
@Entity()
@Unique(['tenantId', 'squareLocationId'])
export class SquareLocationLink {
    @PrimaryGeneratedColumn()
    id: number;

    /** Denormalized scalar column (not a relation), like `SquareConnection`. */
    @Column()
    tenantId: number;

    @Column()
    squareLocationId: string;

    @Column()
    squareName: string;

    /** Square's `ACTIVE` / `INACTIVE`. */
    @Column({ type: 'varchar', nullable: true })
    squareStatus: string | null;

    /** IANA timezone; decides an order's local fulfillment day. */
    @Column({ type: 'varchar', nullable: true })
    timezone: string | null;

    /** Only enabled, mapped links feed orders into Petsi. */
    @Column({ default: false })
    enabled: boolean;

    @Column({ type: 'int', nullable: true })
    locationId: number | null;

    @ManyToOne(() => Location, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'locationId' })
    location?: Location | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
