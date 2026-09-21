import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { EntityBase } from '../../../common/base/entity.base';
import { CreateRoleFeatureDto } from '../dto/create-role-feature.dto';
import { UpdateRoleFeatureDto } from '../dto/update-role-feature.dto';
import { Feature } from '../utils/feature.registry';

export type RoleFeatureEntity = EntityBase<RoleFeature, CreateRoleFeatureDto, UpdateRoleFeatureDto>;

/**
 * A sparse existence table: a row's presence means `roleId` grants
 * `feature` — no row for a given `(roleId, feature)` means that role does
 * not grant it. Grants are added/removed, never edited in place.
 */
@Entity()
@Unique(['tenantId', 'roleId', 'feature'])
export class RoleFeature {
    @ApiProperty({
        example: 1,
        description: 'The unique identifier of the entity',
    })
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * The Tenant this grant belongs to. Denormalized scalar column (not a
     * relation) so ServiceBase-level tenant filtering never needs a join.
     */
    @ApiProperty({
        example: 1,
        description: 'The Tenant this entity belongs to',
    })
    @Column()
    tenantId: number;

    @ApiProperty({
        example: 1,
        description: 'The Role this feature is granted to',
    })
    @Column()
    roleId: number;

    @ApiProperty({
        example: 'RECIPE_MANAGEMENT',
        description: 'The granted feature',
    })
    @Column()
    feature: Feature;
}
