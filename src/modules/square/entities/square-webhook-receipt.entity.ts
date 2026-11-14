import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

/**
 * One row per Square webhook event Petsi has processed, keyed by Square's
 * `event_id` (unique across sellers). Square delivers at least once, so a
 * repeated delivery finds its row and is acknowledged without a second write.
 * Events dropped before processing (unknown or disabled tenant) get no row.
 */
@Entity()
export class SquareWebhookReceipt {
    @PrimaryColumn()
    eventId: string;

    @Column()
    tenantId: number;

    @Column()
    type: string;

    @CreateDateColumn({ type: 'timestamptz' })
    receivedAt: Date;
}
