import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { LabelType } from "./label-type.entity";
import { MenuItem } from "../../menu-items/entities/menu-item.entity";

/**
 * References a {@link menuItem} with a {@link LabelType} and a url to the label image for printing.
 */
@Entity()
@Unique(['menuItem', 'imageUrl', 'labelType'])
export class Label {
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * MenuItem that this image/type combination is for.
     * Example:
     * - MenuItem: Classic Apple, Type: 4x2, imageUrl: image.com/wsClapple
     * - MenuItem: Classic Apple, Type: 2x1, imageUrl: image.com/cutieClapple
     * - MenuItem: ChickenPotPie, Type: 4x6, imageUrl: image.com/frozenPotPie
     */
    @ManyToOne(() => MenuItem, { onDelete: 'CASCADE', nullable: false })
    menuItem: MenuItem;

    /**
     * Url of image stored in 3rd party source
     */
    @Column({ type: 'text', nullable: false })
    imageUrl: string;

    /**
     * A {@link LabelType} for categories like: "4x2", "2x1", or "ingredient label"
     */
    @ManyToOne(() => LabelType, { nullable: true, onDelete: 'SET NULL' })
    labelType?: LabelType | null;
}