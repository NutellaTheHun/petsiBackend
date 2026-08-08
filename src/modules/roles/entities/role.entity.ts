import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { EntityBase } from '../../../common/base/entity.base';
import { userLocationExample } from '../../../common/swagger/examples/locations/user-location.example';
import { UserLocation } from '../../locations/entities/user-location.entity';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';

export type RoleEntity = EntityBase<Role, CreateRoleDto, UpdateRoleDto>;

/**
 * A position within a buisness to controll access to certain entities/endpoints, held per-location via {@link UserLocation}.
 *
 * Per buisness logic, "staff" only need to access order management information,
 *
 * While "Management" can access Order-Management as well as recipe costing and inventory management.
 */
@Entity()
@Unique(['tenantId', 'name'])
export class Role {
    @ApiProperty({
        example: 1,
        description: 'The unique identifier of the entity',
    })
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * The Tenant this role belongs to. Denormalized scalar column (not a
     * relation) so ServiceBase-level tenant filtering never needs a join.
     */
    @ApiProperty({
        example: 1,
        description: 'The Tenant this entity belongs to',
    })
    @Column()
    tenantId: number;

    @ApiProperty({ example: 'Staff', description: 'Name of the role' })
    @Column()
    name: string;

    /**
     * List of location assignments where a user holds this role.
     */
    @ApiProperty({
        example: [userLocationExample(new Set<string>(), true)],
        description: 'List of location assignments where a user holds this role',
        type: () => UserLocation,
        isArray: true,
    })
    @ManyToMany(() => UserLocation, (userLocation) => userLocation.roles)
    userLocations: UserLocation[];
}
