import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityBase } from '../../../base/entity-base';
import { roleExample } from '../../../util/swagger-examples/roles/role.example';
import { Role } from '../../roles/entities/role.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

export type UserEntity = EntityBase<User, CreateUserDto, UpdateUserDto>;

/**
 * A set of credentials and list of {@link Role} to control access to features such as order management, recipe costing, and inventory management.
 */
@Entity({ name: 'app_users' })
export class User {
  @ApiProperty({ example: 1, description: 'The unique identifier of the user' })
  @PrimaryGeneratedColumn()
  id: number;

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
  @Column({ unique: true })
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

  @ApiProperty({
    example: [roleExample(new Set<string>(), true)],
    description: 'list of roles the user possess to determine feature access',
    type: () => Role,
    isArray: true,
  })
  @ManyToMany(() => Role, (role) => role.users, { onDelete: 'CASCADE' })
  @JoinTable()
  roles: Role[] = [];
}
