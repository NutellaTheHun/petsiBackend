import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Order } from "./order.entity";

/**
 * A category of {@link Order} for filtering/organization such as: "square", "wholesale", "retail", "farmers market", "special", ect.
 */
@Entity()
export class OrderCategory{
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, nullable: false })
    name: string;

    /**
     * List of {@link Order} falling under the type.
     */
    @OneToMany(() => Order, (order) => order.type, { nullable: true })
    orders?: Order[] | null;
}