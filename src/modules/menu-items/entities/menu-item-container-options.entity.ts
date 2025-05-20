import { Column, Entity, JoinTable, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { MenuItemContainerRule } from "./menu-item-container-rule.entity";
import { MenuItem } from "./menu-item.entity";

/**
 * When a {@link MenuItem} is a dynamic container (meaning the container can contain a custom amount of menuItems)
 * the {@link MenuItemContainerOptions} describes the valid {@link MenuItem} and their {@link MenuItemSize} that are 
 * allowed within the container.
 */
@Entity()
export class MenuItemContainerOptions {
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * The {@link MenuItem} container that the options apply to.
     */
    @OneToOne(() => MenuItem, (container) => container.containerOptions, { onDelete: 'CASCADE', nullable: false })
    parentContainer: MenuItem;

    /**
     * A list of {@link MenuItemContainerRule} determining valid items, their sizes, and amounts.
     */
    @OneToMany(() => MenuItemContainerRule, c => c.parentContainerOption, { cascade: true, eager: true })
    @JoinTable()
    containerRules: MenuItemContainerRule[];

    /**
     * The total amount of items the container holds. 
     */
    @Column({ nullable: false})
    validQuantity: number;
}