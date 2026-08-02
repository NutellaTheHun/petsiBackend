import { ApiProperty } from '@nestjs/swagger';
import {
    Column,
    Entity,
    JoinTable,
    ManyToMany,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityBase } from '../../../common/base/entity.base';
import { roleExample } from '../../../common/swagger/examples/roles/role.example';
import { userExample } from '../../../common/swagger/examples/users/user.example';
import { Role } from '../../roles/entities/role.entity';
import { User } from '../../users/entities/user.entities';
import { CreateUserLocationDto } from '../dto/create-user-location.dto';
import { UpdateUserLocationDto } from '../dto/update-user-location.dto';

export type UserLocationEntity = EntityBase<
    UserLocation,
    CreateUserLocationDto,
    UpdateUserLocationDto
>;

/**
 * Assigns a {@link User} to a {@link Location} with the set of {@link Role}s
 * they hold specifically at that location — a user's roles at one location
 * are independent of their roles at another. A tenant-wide admin (`User.isTenantAdmin`)
 * has access to every location without needing an assignment row here.
 */
@Entity()
export class UserLocation {
    @ApiProperty({
        example: 1,
        description: 'The unique identifier of the entity',
    })
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * The Tenant this assignment belongs to. Denormalized scalar column (not
     * a relation) so ServiceBase-level tenant filtering never needs a join.
     */
    @ApiProperty({
        example: 1,
        description: 'The Tenant this entity belongs to',
    })
    @Column()
    tenantId: number;

    /**
     * The Location this assignment grants access to. Denormalized scalar
     * column, same reasoning as tenantId.
     */
    @ApiProperty({
        example: 1,
        description: 'The Location this assignment grants access to',
    })
    @Column()
    locationId: number;

    @ApiProperty({
        example: userExample(new Set<string>(), true),
        description: 'The user this assignment is for',
        type: () => User,
    })
    @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
    user: User;

    @ApiProperty({
        example: [roleExample(new Set<string>(), true)],
        description: 'Roles the user holds at this location',
        type: () => Role,
        isArray: true,
    })
    @ManyToMany(() => Role, (role) => role.userLocations)
    @JoinTable()
    roles: Role[];
}
