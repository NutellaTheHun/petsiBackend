import { Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { MenuItemContainerOptions } from "./menu-item-container-options.entity";
import { MenuItemSize } from "./menu-item-size.entity";
import { MenuItem } from "./menu-item.entity";

/**
 * One rule within a {@link MenuItemContainerOptions} that allow one {@link MenuItem} and valid {@link MenuItemSize}
 * within the {@link MenuItemContainerOptions} parent {@link MenuItem}
 */
@Entity()
export class MenuItemContainerRule {
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * The {@link MenuItemContainerOptions} that this rule applies to.
     */
    @ManyToOne(() => MenuItemContainerOptions, (options) => options.containerRules, { onDelete: 'CASCADE', orphanedRowAction: 'delete' })
    parentContainerOption: MenuItemContainerOptions;

    /**
     * The {@link MenuItem} that this rule states is allowed in the parent container.
     */
    @ManyToOne(() => MenuItem, { onDelete: 'CASCADE', nullable: false, eager: true })
    validItem: MenuItem;

    /**
     * The list of {@link MenuItemSize} of the {@link validItem} that is allowed in the parent container.
     */
    @ManyToMany(() => MenuItemSize, { eager: true })
    @JoinTable()
    validSizes: MenuItemSize[];
}