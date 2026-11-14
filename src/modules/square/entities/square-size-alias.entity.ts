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
import { MenuItemSize } from '../../menu-items/entities/menu-item-size.entity';

/**
 * Tenant-wide: the Petsi size a Square variation name means. One row per
 * distinct `normalizeSquareName(variation name)`; `menuItemSizeId` is
 * auto-matched on insert only and is otherwise the tenant's choice.
 */
@Entity()
@Unique(['tenantId', 'squareVariationName'])
export class SquareSizeAlias {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    tenantId: number;

    /** Stored normalized (`normalizeSquareName`). */
    @Column()
    squareVariationName: string;

    @Column({ type: 'int', nullable: true })
    menuItemSizeId: number | null;

    @ManyToOne(() => MenuItemSize, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'menuItemSizeId' })
    menuItemSize?: MenuItemSize | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
