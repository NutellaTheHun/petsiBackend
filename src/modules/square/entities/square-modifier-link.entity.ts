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
import {
    SQUARE_MAPPING_SOURCES,
    SquareMappingSource,
} from './square-variation-link.entity';

export const SQUARE_MODIFIER_KINDS = ['item', 'ignore'] as const;

export type SquareModifierKind = (typeof SQUARE_MODIFIER_KINDS)[number];

/**
 * One row per Square `MODIFIER`. A "choose 6" box has one modifier list per
 * slot, each with its own copy of every flavor, so one flavor is several rows;
 * mapping one applies to its same-named siblings on the same Square item
 * (`SquareModifierPropagationService`).
 *
 * The catalog sync writes the Square-side fields (names, `squareItemIds`,
 * `isDeleted`). `kind`, the mapping and `enabled` are the tenant's after
 * insert; a `manual` row is never touched by propagation or category toggles.
 * A row with `kind = 'item'` and no menu item is unmapped.
 */
@Entity()
@Unique(['tenantId', 'squareModifierId'])
export class SquareModifierLink {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    tenantId: number;

    @Column()
    squareModifierId: string;

    @Column()
    squareModifierListId: string;

    @Column()
    squareModifierListName: string;

    @Column()
    squareModifierName: string;

    /** The Square items the modifier list is attached to, sorted. */
    @Column({ type: 'text', array: true, default: () => "'{}'" })
    squareItemIds: string[];

    /** The modifier's or its list's deleted flag. */
    @Column({ default: false })
    isDeleted: boolean;

    @Column({ default: true })
    enabled: boolean;

    @Column({
        type: 'enum',
        enum: SQUARE_MODIFIER_KINDS,
        enumName: 'square_modifier_kind',
        default: 'item',
    })
    kind: SquareModifierKind;

    /** A `SINGLE` menu item; null (with `kind = 'item'`) means unmapped. */
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
