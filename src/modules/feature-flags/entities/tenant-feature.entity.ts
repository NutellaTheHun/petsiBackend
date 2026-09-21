import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Feature } from '../utils/feature.registry';

/**
 * A sparse existence table: a row's presence means `feature` is enabled for
 * `tenantId` — there is no `enabled: boolean` column, and no row means
 * disabled. Writes happen exclusively through `TenantProvisioningService`;
 * there is no public write API for this entity (see feature-flags PRD).
 */
@Entity()
@Unique(['tenantId', 'feature'])
export class TenantFeature {
    @ApiProperty({
        example: 1,
        description: 'The unique identifier of the entity',
    })
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * The Tenant this feature is enabled for. Denormalized scalar column
     * (not a relation), same rationale as every other tenant-scoped entity.
     */
    @ApiProperty({
        example: 1,
        description: 'The Tenant this feature is enabled for',
    })
    @Column()
    tenantId: number;

    @ApiProperty({
        example: 'ORDER_MANAGEMENT',
        description: 'The enabled feature',
    })
    @Column()
    feature: Feature;
}
