import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Label } from "./label.entity";

/**
 * Specifies the size of a {@link Label} with a name.
 * - Example: a 4x2 label for wholesale, or a 2x1 cutie label, or a 4x6 pot pie sticker. 
 */
@Entity()
export class LabelType {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, nullable: false })
    name: string;
}