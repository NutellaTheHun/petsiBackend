import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { OrderMenuItem } from "./order-menu-item.entity";
import { OrderType } from "./order-type.entity";

@Entity()
export class Order {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    squareOrderId?: string;

    @Column({ nullable: false })
    type: OrderType;

    @Column({ nullable: false })
    recipient: string;

    @CreateDateColumn()
    createdAt: Date;
    
    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ nullable: false })
    fulfillmentDate: Date;

    @Column({ nullable: false })
    fulfillmentType: string;

    @Column({ nullable: true })
    deliveryAddress?: string;

    @Column({ nullable: true })
    phoneNumber?: string;

    @Column({ nullable: true })
    email?: string;

    @Column({ nullable: true })
    note?: string;

    @Column()
    isFrozen: boolean;

    @Column()
    isWeekly: boolean;

    @OneToMany(() => OrderMenuItem, (item) => item.order, { nullable: false })
    items: OrderMenuItem[] = [];
}
