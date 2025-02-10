import { OrderMenuItem } from "src/modules/orders/entities/order-menu-item.entity";
import { Column, CreateDateColumn, Entity, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { MenuCategory } from "./menu-category.entity";
import { MenuItemSize } from "./menu-item-size.entity";

@Entity()
export class MenuItem {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable:true })
    squareCatalogId?: string;

    @Column({ nullable:true })
    squareCategoryId?: string;

    // Get category a reference of its items (like inventory item/category)
    @ManyToOne(() => MenuCategory, { nullable: true, onDelete: 'SET NULL'})
    Category?: MenuCategory;

    @Column({ nullable: false })
    name: string;

    @Column({ nullable: false })
    searchNames: string[] = [];

    @OneToOne(() => MenuItem, { nullable:true })
    veganOption?: MenuItem;

    @OneToOne(() => MenuItem, {nullable: true})
    takeNBakeOption?: MenuItem;

    @OneToOne(() => MenuItem, { nullable:true })
    veganTakeNBakeOption?: MenuItem;

    @ManyToOne(() => MenuItemSize, { nullable: false })
    validSizes: MenuItemSize[] = [];

    @Column({ default: false })
    isPOTM: boolean;

    @Column({ default: false })
    isParbake: boolean;

    @OneToMany(() => OrderMenuItem, onOrder => onOrder.menuItem, { nullable: false })
    onOrder: OrderMenuItem[] = [];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
