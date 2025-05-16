import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../../users/entities/user.entities";

/**
 * A position within a buisness to controll access to certain entities/endpoints
 * 
 * Per buisness logic, "staff" only need to access order management information,
 * 
 * While "Management" can access Order-Management as well as recipe costing and inventory management.
 */
@Entity()
export class Role{
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false, unique: true})
    name: string;

    /**
     * List of users who hold that role.
     */
    @ManyToMany(() => User, (user) => user.roles, { nullable: true, onDelete: 'CASCADE' })
    @JoinTable()
    users: User[];
}