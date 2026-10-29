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
import { MenuItem } from '../../menu-items/entities/menu-item.entity';

export const SQUARE_MODIFIER_MODES = [
    'none',
    'modifier_is_item',
    'container_contents',
] as const;

export type SquareModifierMode = (typeof SQUARE_MODIFIER_MODES)[number];

export const SQUARE_MAPPING_SOURCES = ['derived', 'manual'] as const;

export type SquareMappingSource = (typeof SQUARE_MAPPING_SOURCES)[number];

/**
 * One row per Square `ITEM_VARIATION` (order lines reference variations): the
 * source of truth for ingest. The catalog sync writes the Square-side fields.
 * A `derived` link's mapping and `modifierMode` are recomputed from the item
 * hint and size alias (`SquareCatalogDerivationService`); a `manual` link's
 * are the tenant's and are never touched. `enabled` is always the tenant's
 * after insert.
 */
@Entity()
@Unique(['tenantId', 'squareVariationId'])
export class SquareVariationLink {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    tenantId: number;

    @Column()
    squareVariationId: string;

    @Column()
    squareItemId: string;

    @Column()
    squareItemName: string;

    @Column()
    squareVariationName: string;

    /** Square's catalog version: a bigint, which the driver reads as a string. */
    @Column({ type: 'bigint', nullable: true })
    squareVersion: string | null;

    @Column({ default: false })
    isDeleted: boolean;

    /** The item's archived flag (variations can't be archived on their own). */
    @Column({ default: false })
    isArchived: boolean;

    @Column({ default: true })
    enabled: boolean;

    @Column({ type: 'int', nullable: true })
    menuItemId: number | null;

    @ManyToOne(() => MenuItem, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'menuItemId' })
    menuItem?: MenuItem | null;

    @Column({ type: 'int', nullable: true })
    menuItemSizeId: number | null;

    @ManyToOne(() => MenuItemSize, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'menuItemSizeId' })
    menuItemSize?: MenuItemSize | null;

    @Column({
        type: 'enum',
        enum: SQUARE_MODIFIER_MODES,
        enumName: 'square_modifier_mode',
        default: 'none',
    })
    modifierMode: SquareModifierMode;

    @Column({
        type: 'enum',
        enum: SQUARE_MAPPING_SOURCES,
        enumName: 'square_mapping_source',
        default: 'derived',
    })
    mappingSource: SquareMappingSource;

    /** Null until the tenant views or saves it: "needs review". */
    @Column({ type: 'timestamptz', nullable: true })
    reviewedAt: Date | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
