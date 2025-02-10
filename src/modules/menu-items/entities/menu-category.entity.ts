import { Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { MenuItem } from "./menu-item.entity";

@Entity()
export class MenuCategory {
    @PrimaryGeneratedColumn()
    id: number;

    @OneToMany(() => MenuItem, (item) => item.Category, { nullable: false })
    name: string;

    @OneToMany(() => MenuItem, (item) => item.Category, {nullable: false})
    items: MenuItem[] = []
}