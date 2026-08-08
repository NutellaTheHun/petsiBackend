import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { EntityBase } from '../../../common/base/entity.base';
import { tenantExample } from '../../../common/swagger/examples/tenants/tenant.example';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { CreateLocationDto } from '../dto/create-location.dto';
import { UpdateLocationDto } from '../dto/update-location.dto';

export type LocationEntity = EntityBase<Location, CreateLocationDto, UpdateLocationDto>;

/**
 * A physical site belonging to a {@link Tenant}. Operational data (orders,
 * inventory counts, etc.) is scoped to a specific Location.
 */
@Entity()
export class Location {
    @ApiProperty({
        example: 1,
        description: 'The unique identifier of the entity',
    })
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * The Tenant this Location belongs to.
     */
    @ApiProperty({
        example: tenantExample(new Set<string>(), true),
        description: 'The Tenant this location belongs to',
        type: () => Tenant,
    })
    @ManyToOne(() => Tenant, { onDelete: 'CASCADE', nullable: false })
    tenant: Tenant;

    @ApiProperty({ example: 'Downtown', description: 'Name of the location' })
    @Column()
    name: string;

    @ApiPropertyOptional({
        description: 'Street address of the location.',
        example: '1 Broken Dreams Blvd',
        nullable: true,
        type: 'string',
    })
    @Column({ nullable: true, type: 'varchar' })
    address: string | null;

    @ApiPropertyOptional({
        description: 'Contact phone number for the location.',
        example: '555-420-6969',
        nullable: true,
        type: 'string',
    })
    @Column({ nullable: true, type: 'varchar' })
    phoneNumber: string | null;

    @ApiPropertyOptional({
        description: 'Contact email for the location.',
        example: 'downtown@petsi.com',
        nullable: true,
        type: 'string',
        format: 'email',
    })
    @Column({ nullable: true, type: 'varchar' })
    email: string | null;

    @ApiProperty({
        example: '2025-06-06T19:22:07.102Z',
        description: 'Date the location was created',
    })
    @CreateDateColumn()
    createdAt: Date;

    @ApiProperty({
        example: '2025-06-06T19:22:07.102Z',
        description: 'Date the location was last modified',
    })
    @UpdateDateColumn()
    updatedAt: Date;
}
