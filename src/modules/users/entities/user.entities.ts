import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Role } from "../../roles/entities/role.entity";

/**
 * A set of credentials and list of {@link Role} to control access to features such as order management, recipe costing, and inventory management.
 */
@Entity({ name: "app_users" })
export class User{
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false, unique: true })
    username: string;

    @Column({ nullable: true })
    email?: string | null;

    @Column({ nullable: false })
    password: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    /**
     * List of {@link Role} the user holds.
     */
    @ManyToMany(() => Role, (role) => role.users, { onDelete: 'CASCADE' })
    @JoinTable()
    roles: Role[];
}