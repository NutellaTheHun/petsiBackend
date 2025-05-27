import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Label } from "./label.entity";

/**
 * Specifies the size of a {@link Label} with a name.
 * - Example: a 4"x2" label for wholesale, or a 2"x1" cutie label, or a 4"x6" pot pie sticker. 
 */
@Entity()
export class LabelType {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, nullable: false })
    labelTypeName: string;

    /**
     * In hundreths of an inch.
     * 400x200(labelLength)
     */
    @Column({ nullable: false })
    labelTypeLength: number;

    /**
     * In hundreths of an inch.
     * 400(labelWidth)x200
     */
    @Column({ nullable: false })
    labelTypeWidth: number;
}