import { Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { MenuItemSize } from "./menu-item-size.entity";
import { MenuItem } from "./menu-item.entity";
import { MenuItemComponentOptions } from "./menu-item-component-options.entity";

@Entity()
export class ComponentOption {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => MenuItemComponentOptions, (options) => options.validComponents, { onDelete: 'CASCADE' })
    parentOption: MenuItemComponentOptions;

    @ManyToOne(() => MenuItem, { onDelete: 'CASCADE', eager: true })
    validItem: MenuItem;

    @ManyToMany(() => MenuItemSize, { eager: true })
    @JoinTable()
    validSizes: MenuItemSize[];

    @Column({ default: 0 })
    validQuantity: number;
}