import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { LabelType } from "./label-type.entity";
import { MenuItem } from "../../menu-items/entities/menu-item.entity";

/**
 * Contains all labels associated a menuItem, such as the assortment of wholesale labels (4x2, 2x1)
 * and any future labels required. Holds URLs to remote storage holding the images.
 */
@Entity()
@Unique(['menuItem', 'imageUrl', 'type'])
export class Label {
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * When a menuItem is deleted, its associated labels will be removed.
     */
    @ManyToOne(() => MenuItem, { onDelete: 'CASCADE', nullable: false })
    menuItem: MenuItem;

    /**
     * Url of image stored in 3rd party source
     */
    @Column({ type: 'text', nullable: false })
    imageUrl: string;

    /**
     * A label type for categories like: "4x2", "2x1", or "ingredient label"
     */
    @ManyToOne(() => LabelType, {nullable: true, onDelete: 'SET NULL' })
    type: LabelType;
}