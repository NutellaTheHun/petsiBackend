import { Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { UnitOfMeasure } from "./unit-of-measure.entity";

/**
 * The type of metric that a unit represents, such as a measurement "by volume" or "by weight" or "by unit"
 */
@Entity()
export class UnitCategory{
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(() => UnitOfMeasure, (unit) => unit.category, { nullable: false})
    units: UnitOfMeasure[] = []
}