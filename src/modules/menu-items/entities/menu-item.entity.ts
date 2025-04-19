import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { OrderMenuItem } from "../../orders/entities/order-menu-item.entity";
import { MenuItemCategory } from "./menu-item-category.entity";
import { MenuItemSize } from "./menu-item-size.entity";

/**
 * An item that is a literal product to be sold. 
 * Can be either user created, or originate from Square's Catalog API.
 */
@Entity()
export class MenuItem {
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * MenuItems that originate from Square's Catalog API will retain its catalog id. 
     * Otherwise this variable will be null
     */
    @Column({ nullable: true })
    squareCatalogId?: string;

    /**
     * MenuItems that originate from Square's Catalog API will retain its category id. 
     * Otherwise this variable will be null
     */
    @Column({ nullable: true })
    squareCategoryId?: string;

    /**
     * - On entity insertion, the item's category.items property is passed this item.
     * - If this item is deleted, this item will automatically be removed it's referenced category.
     */
    @ManyToOne(() => MenuItemCategory, { nullable: true, onDelete: 'SET NULL'})
    category?: MenuItemCategory;

    @Column({ nullable: false })
    name: string;

    /**
     * A list of common names, abrieviations, and acroynms an item has,
     * and is captured for search purposes (Speicifically the drop down menu). Per MenuItem, users can add and 
     * remove searchable names to associate with the item.
     */
    @Column( "text", { array: true, nullable: true })
    searchNames?: string[] | null;

    /**
     * A MenuItem that represents the vegan version of the MenuItem object. Otherwise the value is null.
     * - Example: MenuItem {Classic Apple Pie}, MenuItem.veganVersion={Vegan Apple} (A literal other MenuItem in the catalog)
     * - Example: MenuItem {Keylime Pie}, MenuItem.veganOption={null}
     * - Necessary for aggregating the pie and its vegan version together on the BackListPie report (vegan amount denoted with a "V")
     */
    @OneToOne(() => MenuItem, { nullable:true })
    veganOption?: MenuItem;

    /**
     * A MenuItem in the catalog that represents the takeNBake (and take'n thaw) version of the MenuItem object, otherwise is null.
     * - Example: MenuItem {Cherry Pie}, MenuItem.takeNBakeOption={Take'n Bake Cherry Pie}
     * - Example: MenuItem {Bananna Cream Pie}, MenuItem.takeNBakeOption={null}
     */
    @OneToOne(() => MenuItem, {nullable: true})
    takeNBakeOption?: MenuItem;

    /**
     * A MenuItem in the catalog that represents the vegan takeNBake (and take'n thaw) version of the MenuItem object, otherwise is null.
     * - Example: MenuItem {Classic Apple}, MenuItem.veganTakeNBakeOption={Vegan Apple Take'n Bake}
     * - Example: MenuItem {Bananna Cream Pie}, MenuItem.takeNBakeOption={null}
     */
    @OneToOne(() => MenuItem, { nullable:true })
    veganTakeNBakeOption?: MenuItem;

    /**
     * The type of sizes that are valid to place orders with.
     * - Pies can be sizes Cutie (3"), Small (5"), Medium (8"), and Large (10").
     * - Not all pies are necessarily available in all sizes.
     * - All items except pies by default are size "regular" (Some merch have sizing, each size is its own ite)
     */
    @ManyToOne(() => MenuItemSize, { nullable: true })
    validSizes?: MenuItemSize[] | null;

    /**
     * A flag for pies that are pie of the month. POTM has a special row on BackListPie report to be 
     * whatever pie that is on order and isPOTM = true.
     * - There is always only one pie of the month.
     */
    @Column({ default: false })
    isPOTM: boolean;

    /**
     * A flag for pies that require parbakes to be made. Necessary for populating the parbakes row on the BackListPie report.
     */
    @Column({ default: false })
    isParbake: boolean;

    /**
     * The list of MenuItems, their size, and quantity associated with the order.
     */
    //@OneToMany(() => OrderMenuItem, onOrder => onOrder.menuItem, { nullable: true })
    //onOrder?: OrderMenuItem[] | null;

    /**
     * The date the order is inserted into the database. 
     * (Square orders will technically have a different create date that is not used in this property)
     */
    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
