import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { TemplateMenuItem } from "./template-menu-item.entity";

@Entity()
export class Template {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, nullable: false })
    name: string;

    @Column({ default: false })
    isPie: boolean;

    @OneToMany(() => TemplateMenuItem, (templateItem) => templateItem.template, { nullable: false, cascade: true })
    templateItems?: TemplateMenuItem[] | null;
}
