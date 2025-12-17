import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { EntityBase } from '../../../base/entity-base';
import { userExample } from '../../../util/swagger-examples/users/user.example';
import { User } from '../../users/entities/user.entities';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';

export type RoleEntity = EntityBase<Role, CreateRoleDto, UpdateRoleDto>;

/**
 * A position within a buisness to controll access to certain entities/endpoints
 *
 * Per buisness logic, "staff" only need to access order management information,
 *
 * While "Management" can access Order-Management as well as recipe costing and inventory management.
 */
@Entity()
export class Role {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the entity',
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Staff', description: 'Name of the role' })
  @Column({ unique: true })
  name: string;

  /**
   * List of users who hold that role.
   */
  @ApiProperty({
    example: [userExample(new Set<string>(), true)],
    description: 'List of users who possess this role',
    type: () => User,
    isArray: true,
  })
  @ManyToMany(() => User, (user) => user.roles)
  users: User[] = [];
}
