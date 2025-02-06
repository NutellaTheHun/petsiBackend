import { Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Order } from "./order.entity";

@Entity()
export class OrderType{
    @PrimaryGeneratedColumn()
    id: number;

    @OneToMany(() => Order, (order) => order.type, { nullable: false })
    name: string;
}