import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToMany } from "typeorm";
import { Role } from "../../roles/entities/role.entities";
import { Exclude } from "class-transformer";

@Entity({ name: "app_users" })
export class User{
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false, unique: true })
    username: string;

    @Column({ nullable: true })
    email: string;

    @Exclude()
    @Column({ nullable: false })
    passwordHash: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToMany(() => Role, (role) => role.users, { nullable: true, onDelete: 'CASCADE' })
    roles: Role[];
}
