import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Order } from "./order.entity";

/**
 * A category of order for filtering/organization such as: "square", "wholesale", "retail", "farmers market", "special", ect.
 */
@Entity()
export class OrderType{
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, nullable: false })
    name: string;

    @OneToMany(() => Order, (order) => order.type, { nullable: true })
    orders?: Order[] | null;
}