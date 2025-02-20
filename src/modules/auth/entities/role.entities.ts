import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entities";

@Entity()
export class Role{
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false, unique: true})
    name: string;

    @ManyToMany(() => User, (user) => user.roles, { nullable: true, onDelete: 'CASCADE' })
    @JoinTable()
    users: User[];
}