import { ApiProperty } from '@nestjs/swagger';
import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    Unique,
    UpdateDateColumn,
} from 'typeorm';
import { EntityBase } from '../../../common/base/entity.base';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

export type UserEntity = EntityBase<User, CreateUserDto, UpdateUserDto>;

/**
 * A set of credentials to control access to features such as order management, recipe costing, and inventory management.
 *
 * Roles are attached per-location via {@link UserLocation}, not directly on the user — a user's roles at one
 * location can differ from their roles at another.
 */
@Entity({ name: 'app_users' })
@Unique(['tenantId', 'name'])
export class User {
    @ApiProperty({ example: 1, description: 'The unique identifier of the user' })
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * The Tenant this user belongs to. Denormalized scalar column (not a
     * relation) so ServiceBase-level tenant filtering never needs a join.
     */
    @ApiProperty({
        example: 1,
        description: 'The Tenant this entity belongs to',
    })
    @Column()
    tenantId: number;

    @ApiProperty({
        example: false,
        description:
            'Grants access to every current and future location under the tenant without a per-location UserLocation assignment',
    })
    @Column({ default: false })
    isTenantAdmin: boolean;

    @ApiProperty({
        example: '2025-06-05T23:00:17.814Z',
        description: 'date the user was created',
    })
    @CreateDateColumn()
    createdAt: Date;

    @ApiProperty({
        example: '2025-06-05T23:00:17.814Z',
        description: 'date the user was most recently updated',
    })
    @UpdateDateColumn()
    updatedAt: Date;

    @ApiProperty({ example: 'johndoe', description: 'Username of the user' })
    @Column()
    name: string;

    @ApiProperty({
        example: '1234abc',
        description:
            'Only used when creating or updating a user, not returned in responses',
        type: 'string',
    })
    @Column()
    password: string;

    @ApiProperty({
        example: 'john@example.com',
        description: 'Email address',
        type: 'string',
        format: 'email',
        nullable: true,
    })
    @Column({ nullable: true, type: 'varchar' })
    email: string | null = null;
}
