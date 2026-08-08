import { ApiProperty } from '@nestjs/swagger';
import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { EntityBase } from '../../../common/base/entity.base';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';

export type TenantEntity = EntityBase<Tenant, CreateTenantDto, UpdateTenantDto>;

/**
 * A business account. Sits above the tenant/location scoping hierarchy — no
 * tenant/location scoping applies to Tenant itself.
 */
@Entity()
export class Tenant {
    @ApiProperty({
        example: 1,
        description: 'The unique identifier of the entity',
    })
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({ example: 'Petsi Pies', description: 'Name of the tenant' })
    @Column()
    name: string;

    @ApiProperty({
        description: 'Unique subdomain the tenant is resolved from (e.g. tenant1.app.com).',
        example: 'petsi',
    })
    @Column({ unique: true })
    subdomain: string;

    @ApiProperty({
        example: '2025-06-06T19:22:07.102Z',
        description: 'Date the tenant was created',
    })
    @CreateDateColumn()
    createdAt: Date;

    @ApiProperty({
        example: '2025-06-06T19:22:07.102Z',
        description: 'Date the tenant was last modified',
    })
    @UpdateDateColumn()
    updatedAt: Date;
}
