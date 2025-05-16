import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { OrderMenuItem } from "./order-menu-item.entity";
import { OrderCategory } from "./order-category.entity";

/**
 * A list of {@link OrderMenuItem} and fullfilment information, facilitating the purchasing of {@link MenuItem}.
 */
@Entity("orders")
export class Order {
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * The category of order
     * - Example: "Wholesale", "Special", "Square", "Farmers Market"
     */
    @ManyToOne(() => OrderCategory, { nullable: false })
    type: OrderCategory;

    /**
     * Name of the owner of the order, such as the name of a person or buisness.
     */
    @Column({ nullable: false })
    recipient: string;

    @CreateDateColumn()
    createdAt: Date;
    
    @UpdateDateColumn()
    updatedAt: Date;

    /**
     * The date that the order is due.
     */
    @Column({ nullable: false })
    fulfillmentDate: Date;

    /**
     * Pickup or delivery
     */
    @Column({ nullable: false })
    fulfillmentType: string;
    
    /**
     * Name of the point person to recieve the delivery.
     * 
     * Sometimes different from the recipient/owner of the order
     */
    @Column({ nullable: true})
    fulfillmentContactName?: string;

    /**
     * Only required for orders with fulfillment type delivery
     */
    @Column({ nullable: true })
    deliveryAddress?: string;

    /**
     * Only required for orders with fulfillment type delivery
     */
    @Column({ nullable: true })
    phoneNumber?: string;

    /**
     * Only required for orders with fulfillment type delivery
     */
    @Column({ nullable: true })
    email?: string;

    /**
     * Any additional information for the order.
     */
    @Column({ nullable: true })
    note?: string;

    /**
     * If an order is frozen, it is not an active order,
     * 
     * will not be aggregated in various actions like report creation, 
     * and list population (except when viewing frozen orders exclusively)
     */
    @Column({ default: false })
    isFrozen: boolean;

    /**
     * If an order occurs weekly (such as most wholesale orders),
     * 
     * this flag ensures that its aggregation is calculated appropriately. 
     * 
     * Most orders will be isWeekly=false (A "one-shot" order, most orders are done after fulfillment). 
     */
    @Column({ default: false })
    isWeekly: boolean;

    /**
     * If an order is weekly, the day of the week the order is fulfilled.
     */
    @Column({ nullable: true })
    weeklyFulfillment: string;

    /**
     * The list of {@link OrderMenuItem} that are being purchased.
     */
    @OneToMany(() => OrderMenuItem, (item) => item.order, { cascade: true, nullable: true })
    items?: OrderMenuItem[] | null;
}
