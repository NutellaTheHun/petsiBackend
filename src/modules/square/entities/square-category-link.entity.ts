import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    Unique,
    UpdateDateColumn,
} from 'typeorm';

/**
 * One row per Square `CATEGORY`. The catalog sync writes `squareName`;
 * `enabled` is the tenant's choice, and sets the starting `enabled` of new
 * variation links in the category.
 */
@Entity()
@Unique(['tenantId', 'squareCategoryId'])
export class SquareCategoryLink {
    @PrimaryGeneratedColumn()
    id: number;

    /** Denormalized scalar column (not a relation), like `SquareConnection`. */
    @Column()
    tenantId: number;

    @Column()
    squareCategoryId: string;

    @Column()
    squareName: string;

    @Column({ default: true })
    enabled: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
