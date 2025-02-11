import { MenuItem } from "src/modules/menu-items/entities/menu-item.entity";
import { Column, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Template } from "./template.entity";

export class TemplateMenuItem {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false })
    displayName: string;

    @ManyToOne(() => MenuItem, { nullable: false })
    menuItem: MenuItem;

    @Column({ nullable: false })
    tablePosIndex: number;

    @ManyToOne(() => Template, (template) => template.templateItems, { nullable: false })
    template: Template;
}
