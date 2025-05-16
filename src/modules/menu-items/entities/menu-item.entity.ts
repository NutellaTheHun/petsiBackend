import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { MenuItemCategory } from "./menu-item-category.entity";
import { MenuItemComponent } from "./menu-item-component.entity";
import { MenuItemSize } from "./menu-item-size.entity";

/**
 * An item that is a product to be sold.
 */
@Entity()
export class MenuItem {
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * - Example: "Pie", "Pastry", "Merchandise", "Boxed Pastry", "Catering"
     */
    @ManyToOne(() => MenuItemCategory, { nullable: true, onDelete: 'SET NULL'})
    category?: MenuItemCategory | null;

    @Column({ unique: true, nullable: false })
    name: string;

    /**
     * A different MenuItem that represents the vegan version of the reference holder.
     * - Example: MenuItem {Classic Apple Pie}, MenuItem.veganVersion={Vegan Classic Apple} (A literal other MenuItem in the catalog)
     * - Example: MenuItem {Keylime Pie}, MenuItem.veganOption={null}
     * - Necessary for aggregating the pie and its vegan version together on the BackListPie report (vegan amount denoted with a "V")
     */
    @OneToOne(() => MenuItem, { nullable: true, onDelete: 'SET NULL'  })
    @JoinColumn()
    veganOption?: MenuItem | null;

    /**
     * A different MenuItem that represents the takeNBake (and take'n thaw) version of the reference holder.
     * - Example: MenuItem {Cherry Pie}, MenuItem.takeNBakeOption={Take'n Bake Cherry Pie}
     * - Example: MenuItem {Bananna Cream Pie}, MenuItem.takeNBakeOption={null}
     */
    @OneToOne(() => MenuItem, {nullable: true, onDelete: 'SET NULL' })
    @JoinColumn()
    takeNBakeOption?: MenuItem | null;

    /**
     * A different MenuItem that represents the vegan takeNBake (and take'n thaw) version of the reference holder.
     * - Example: MenuItem {Classic Apple}, MenuItem.veganTakeNBakeOption={Vegan Apple Take'n Bake}
     * - Example: MenuItem {Bananna Cream Pie}, MenuItem.takeNBakeOption={null}
     */
    @OneToOne(() => MenuItem, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn()
    veganTakeNBakeOption?: MenuItem | null;

    /**
     * The {@link MenuItemSize} that the item is available in.
     * 
     * Pies can be sizes Cutie (3"), Small (5"), Medium (8"), and Large (10").
     * 
     * Not all pies are necessarily available in all sizes.
     * 
     * All items except pies by default are size "regular" (Some merch have sizing, each size is its own item)
     * 
     * Some Pastries can be size "mini"
     */
    @ManyToMany(() => MenuItemSize, { nullable: true })
    @JoinTable()
    validSizes?: MenuItemSize[] | null;

    /**
     * A flag for pies that are pie of the month. POTM has a special row on BackListPie report to be 
     * whatever pie that is on order and isPOTM = true.
     * 
     * - There is always only one pie of the month. (Supposed to be)
     */
    @Column({ default: false })
    isPOTM: boolean;

    /**
     * A flag for pies that require parbakes to be made. Necessary for populating the parbakes row on the BackListPie report.
     */
    @Column({ default: false })
    isParbake: boolean;

    /**
     * If the item is a container for other items.
     * 
     * Such as a Box of 6 Muffins,
     * 
     * of a Breakfast Pastry Platter
     * 
     * Can have a hard set composition of items per container size, or a range of viable items that are dynamically chosen when ordered.
     */
    @OneToMany(() => MenuItemComponent, (comp) => comp.container, { cascade: true })
    container?: MenuItemComponent[];

    /**
     * The date the order is inserted into the database. 
     * (Square orders will technically have a different create date that is not used in this property)
     */
    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
