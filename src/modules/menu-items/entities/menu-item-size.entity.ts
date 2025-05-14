import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * - All items except pie are size "regular"
 * - Pies can be size "cutie"(3"), "small"(5"), "medium"(8"), "large"(10")
 */
@Entity()
export class MenuItemSize{
    @PrimaryGeneratedColumn()
    id: number;

    /** 
     * By default, can be "regular", "cutie", "small", "medium", "large" 
     */
    @Column({ unique: true })
    name: string;
}