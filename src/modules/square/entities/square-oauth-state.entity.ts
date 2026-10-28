import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * The nonce of an issued, not yet used OAuth `state`. The callback deletes the
 * row to consume it, so a replayed state finds nothing and is rejected. Rows
 * are short-lived; expired ones are pruned whenever a new state is issued.
 */
@Entity()
export class SquareOAuthState {
    @PrimaryColumn()
    nonce: string;

    @Column()
    tenantId: number;

    @Column({ type: 'timestamptz' })
    expiresAt: Date;
}
