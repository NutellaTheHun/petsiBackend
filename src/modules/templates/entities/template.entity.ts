import { Column, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { TemplateMenuItem } from "./template-menu-item.entity";

export class Template {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false })
    name: string;

    @Column()
    isPie: boolean;

    @OneToMany(() => TemplateMenuItem, (templateItem) => templateItem.template, { nullable: false, cascade: true })
    templateItems?: TemplateMenuItem[] | null;
}
