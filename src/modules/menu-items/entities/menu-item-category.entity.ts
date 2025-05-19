import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { MenuItem } from "./menu-item.entity";

/**
 * Product categories such as "Pie", "Pastry", "Merchandise", "Boxed Pastry"
 */
@Entity()
export class MenuItemCategory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    categoryName: string;

    /**
     * A list of MenuItems with who's category property are set to this instance.
     */
    @OneToMany(() => MenuItem, (item) => item.category, { nullable: true })
    categoryItems?: MenuItem[] | null;
}