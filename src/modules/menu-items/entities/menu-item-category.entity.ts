import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { MenuItem } from "./menu-item.entity";

/**
 * Product categories such as "Pie", "Pastry", "Merchandise", "Boxed Pastry"
 */
@Entity()
export class MenuItemCategory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, nullable: false })
    categoryName: string;

    /**
     * A list of {@link MenuItem} with who's {@link MenuItemCategory} property are set to this instance.
     */
    @OneToMany(() => MenuItem, (item) => item.category)
    categoryItems: MenuItem[];
}