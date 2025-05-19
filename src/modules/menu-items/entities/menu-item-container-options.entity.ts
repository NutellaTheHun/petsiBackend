import { Column, Entity, JoinTable, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { MenuItemContainerRule } from "./menu-item-container-rule.entity";
import { MenuItem } from "./menu-item.entity";

@Entity()
export class MenuItemContainerOptions {
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * The {@link MenuItem} container that the options apply to.
     */
    @OneToOne(() => MenuItem, (container) => container.containerOptions, { onDelete: 'CASCADE' })
    parentContainer: MenuItem;

    /**
     * Is dynamic if the contents of the container can vary within the option's {@link containerRules}
     */
    @Column({ default: false })
    isDynamic: boolean;

    /**
     * A list of rules determining valid items, their sizes, and amounts.
     */
    @OneToMany(() => MenuItemContainerRule, c => c.parentContainerOption, { cascade: true, eager: true })
    @JoinTable()
    containerRules: MenuItemContainerRule[];

    /**
     * The total amount of items the container holds. 
     */
    @Column()
    validQuantity: number;
}