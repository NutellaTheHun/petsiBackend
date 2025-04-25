import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class LabelType {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false })
    name: string;
}