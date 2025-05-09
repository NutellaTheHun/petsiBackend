import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class LabelType {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, nullable: false })
    name: string;
}