import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { userExample } from '../../../util/swagger-examples/users/user.example';
import { User } from '../../users/entities/user.entities';

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
  @Column({ nullable: false, unique: true })
  roleName: string;

  /**
   * List of users who hold that role.
   */
  @ApiProperty({
    example: [userExample(new Set<string>())],
    description: 'List of users who possess this role',
    type: () => User,
    isArray: true,
  })
  @ManyToMany(() => User, (user) => user.roles)
  users: User[];
}
