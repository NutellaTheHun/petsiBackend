import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
    UpdateDateColumn,
} from 'typeorm';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';

/**
 * One row per Square `ITEM`: the menu item its derived variation links take.
 * The catalog sync writes the Square-side fields; `menuItemId` is auto-matched
 * on insert only and is otherwise the tenant's choice. Several hints may point
 * to one menu item (Square allows duplicate item names).
 */
@Entity()
@Unique(['tenantId', 'squareItemId'])
export class SquareItemHint {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    tenantId: number;

    @Column()
    squareItemId: string;

    @Column()
    squareItemName: string;

    /** The item's reporting category, if any. */
    @Column({ type: 'varchar', nullable: true })
    squareCategoryId: string | null;

    @Column({ default: false })
    isArchived: boolean;

    @Column({ default: false })
    isDeleted: boolean;

    @Column({ type: 'int', nullable: true })
    menuItemId: number | null;

    @ManyToOne(() => MenuItem, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'menuItemId' })
    menuItem?: MenuItem | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
