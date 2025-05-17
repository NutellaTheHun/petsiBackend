import { Column, Entity, JoinTable, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { ComponentOption } from "./component-option.entity";
import { MenuItem } from "./menu-item.entity";

@Entity()
export class MenuItemComponentOptions {
    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(() => MenuItem, (container) => container.containerOptions, { onDelete: 'CASCADE' })
    container: MenuItem;

    @Column({ default: false })
    isDynamic: boolean;

    @OneToMany(() => ComponentOption, c => c.parentOption, { cascade: true, eager: true })
    @JoinTable()
    validComponents: ComponentOption[];

    @Column()
    validQuantity: number;
}