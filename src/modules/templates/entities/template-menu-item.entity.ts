import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Template } from "./template.entity";
import { MenuItem } from "../../menu-items/entities/menu-item.entity";

/**
 * A row item on a {@link Template} representing a {@link MenuItem}
 */
@Entity()
export class TemplateMenuItem {
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * The name value to be displayed on the row, representing the referenced {@link MenuItem}
     */
    @Column({ nullable: false })
    displayName: string;

    /**
     * The referenced {@link MenuItem} for the row.
     */
    @ManyToOne(() => MenuItem, { nullable: false, onDelete: 'CASCADE' })
    menuItem: MenuItem;

    /**
     * The position along the column the row exists.
     */
    @Column({ nullable: false })
    tablePosIndex: number;

    /**
     * The parent {@link Template}.
     */
    @ManyToOne(() => Template, (template) => template.templateItems, { orphanedRowAction: 'delete', onDelete: 'CASCADE' })
    parentTemplate: Template;
}
