import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entities";

@Entity()
export class Role{
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false})
    name: string;

    @ManyToMany(() => User, (user) => user.roles, { nullable: false })
    users: User[] = [];
}