import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { TemplateMenuItem } from "./template-menu-item.entity";

/**
 * A list of {@link TemplateMenuItem} to build forms used for baking lists.
 * 
 * Per buisness logic, templates display either pie or pastry products.
 */
@Entity()
export class Template {
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * Example: "Summer Pies", "Spring Pastries"
     */
    @Column({ unique: true, nullable: false })
    name: string;

    /**
     * Differentiates whether the template is for pie products or not.
     */
    @Column({ default: false })
    isPie: boolean;

    /**
     * List of {@link TemplateMenuItem} that describe the form structure.
     */
    @OneToMany(() => TemplateMenuItem, (templateItem) => templateItem.template, { nullable: false, cascade: true })
    templateItems?: TemplateMenuItem[] | null;
}
