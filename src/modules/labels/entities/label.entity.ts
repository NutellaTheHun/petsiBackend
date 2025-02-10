import { MenuItem } from "src/modules/menu-items/entities/menu-item.entity";
import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";

/**
 * Contains all labels associated a menuItem, such as the assortment of wholesale labels (4x2, 2x1)
 * and any future labels required. Holds URLs to remote storage holding the images.
 */
@Entity()
export class Label {
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * When a menuItem is deleted, its associated labels will be removed.
     */
    @OneToOne(() => MenuItem, { onDelete: 'CASCADE', nullable: false })
    menuItem: MenuItem;

    @Column('json', { nullable: false })
    labelUrls: Record<string, string> = {};
}
