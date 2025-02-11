import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { OrderMenuItem } from "./order-menu-item.entity";
import { OrderType } from "./order-type.entity";

@Entity()
export class Order {
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * If an Order originates from Square's order API,
     * this value will contain the order id from their 
     * system, otherwise will be false.
     */
    @Column({ nullable: true })
    squareOrderId?: string;

    @ManyToOne(() => OrderType, { nullable: false })
    type: OrderType;

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
     * and will not be aggregated in various actions like
     * report creation, and list population (except when viewing frozen orders exclusively)
     */
    @Column()
    isFrozen: boolean;

    /**
     * If an order occurs weekly (such as most wholesale orders), 
     * this flag ensures that its aggregation is calculated appropriately. 
     * Most orders will be isWeekly=false (A "one-shot" order, most orders are one and done after fulfillment). 
     */
    @Column()
    isWeekly: boolean;

    @OneToMany(() => OrderMenuItem, (item) => item.order, { nullable: false })
    items: OrderMenuItem[] = [];
}
