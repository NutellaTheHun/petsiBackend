import { MenuItem } from "src/modules/menu-items/entities/menu-item.entity";
import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Label {
    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(type => MenuItem, { onDelete: 'CASCADE', nullable: false })
    menuItem: MenuItem;

    @Column('json', { nullable: false })
    labelUrls: Record<string, string> = {};
}
