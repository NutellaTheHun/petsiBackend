import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { MenuItem } from "./menu-item.entity";

/**
 * Product categories such as "Pie", "Pastry", "Merchandise"
 */
@Entity()
export class MenuItemCategory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    /**
     * A list of MenuItems with who's category property are set to this instance.
     * A MenuItem is added through the BeforeInsert() hook in MenuItem
     * A MenuItem is removed through MenuItem's BeforeRemove() hook.
     */
    @OneToMany(() => MenuItem, (item) => item.category, {nullable: true})
    items?: MenuItem[] | null;
}