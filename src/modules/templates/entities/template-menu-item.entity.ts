import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Template } from "./template.entity";
import { MenuItem } from "../../menu-items/entities/menu-item.entity";

@Entity()
export class TemplateMenuItem {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false })
    displayName: string;

    @ManyToOne(() => MenuItem, { nullable: false })
    menuItem: MenuItem;

    @Column({ nullable: false })
    tablePosIndex: number;

    @ManyToOne(() => Template, (template) => template.templateItems, { nullable: false, orphanedRowAction: 'delete', onDelete: 'CASCADE' })
    template: Template;
}
