import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { MenuItemCategory } from "./menu-item-category.entity";
import { MenuItemContainerItem } from "./menu-item-container-item.entity";
import { MenuItemContainerOptions } from "./menu-item-container-options.entity";
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
    @ManyToOne(() => MenuItemCategory, { nullable: true, onDelete: 'SET NULL', eager: true })
    category?: MenuItemCategory | null;

    @Column({ unique: true, nullable: false })
    itemName: string;

    /**
     * A different {@link MenuItem} that represents the vegan version of the reference holder.
     * - Example: {@link MenuItem} {Classic Apple Pie}, {@link MenuItem}.veganVersion={Vegan Classic Apple} (A literal other {@link MenuItem} in the catalog)
     * - Example: {@link MenuItem} {Keylime Pie}, {@link MenuItem}.veganOption={null}
     * - Necessary for aggregating the pie and its vegan version together on the BackListPie report (vegan amount denoted with a "V")
     */
    @OneToOne(() => MenuItem, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn()
    veganOption?: MenuItem | null;

    /**
     * A different {@link MenuItem} that represents the takeNBake (and take'n thaw) version of the reference holder.
     * - Example: {@link MenuItem} {Cherry Pie}, {@link MenuItem}.takeNBakeOption={Take'n Bake Cherry Pie}
     * - Example: {@link MenuItem} {Bananna Cream Pie}, {@link MenuItem}.takeNBakeOption={null}
     */
    @OneToOne(() => MenuItem, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn()
    takeNBakeOption?: MenuItem | null;

    /**
     * A different {@link MenuItem} that represents the vegan takeNBake (and take'n thaw) version of the reference holder.
     * - Example: {@link MenuItem} {Classic Apple}, {@link MenuItem}.veganTakeNBakeOption={Vegan Apple Take'n Bake}
     * - Example: {@link MenuItem} {Bananna Cream Pie}, {@link MenuItem}.takeNBakeOption={null}
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
    @ManyToMany(() => MenuItemSize)
    @JoinTable()
    validSizes: MenuItemSize[];

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
     * If the item is a container of predetermined list for other items.
     * 
     * Such as the Breakfast Pastry Platter,
     * 
     * Hase a predefined, consistent composition of items per container size.
     * 
     * If a {@link MenuItem} references {@link definedContainerItems}, then {@link containerOptions} must be null/undefined
     */
    @OneToMany(() => MenuItemContainerItem, (comp) => comp.parentContainer, { cascade: true })
    definedContainerItems?: MenuItemContainerItem[];

    /**
     * If the item is a container where the contents are a variable amount of a selection of items.
     * 
     * Such as a Box of 6 Muffins/Scones,
     * 
     * The total amount is predetermined/consistent, but the flavors can be any combination of the total amount.
     * 
     * Example: A box of 6 muffins could be:
     * - { blueberry: 6, Corn: 0, banana: 0 }
     * - { blueberry: 2, Corn: 2, banana: 2 }
     * 
     * If a {@link MenuItem} references {@link containerOptions}, then {@link definedContainerItems} must be null/undefined
     */
    @OneToOne(() => MenuItemContainerOptions, (options) => options.parentContainer, { cascade: true, nullable: true, onDelete: 'SET NULL' })
    @JoinColumn()
    containerOptions?: MenuItemContainerOptions | null;

    /**
     * The date the order is inserted into the database. 
     * (Square orders will technically have a different create date that is not used in this property)
     */
    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}