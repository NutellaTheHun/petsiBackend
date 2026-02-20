import { ApiProperty } from '@nestjs/swagger';
import { Check, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { NestedEntityBase } from '../../../common/base/entity.base';
import { menuItemExample } from '../../../common/swagger/examples/menu-items/menu-item.example';
import { templateExample } from '../../../common/swagger/examples/templates/template.example';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { CreateTemplateMenuItemDto } from '../dto/template-menu-item/create-template-menu-item.dto';
import { NestedCreateTemplateMenuItemDto } from '../dto/template-menu-item/nested-create-template-menu-item.dto';
import { NestedUpdateTemplateMenuItemDto } from '../dto/template-menu-item/nested-update-template-menu-item.dto';
import { UpdateTemplateMenuItemDto } from '../dto/template-menu-item/update-template-menu-item.dto';
import { Template } from './template.entity';

export type TemplateMenuItemEntity = NestedEntityBase<
    TemplateMenuItem,
    CreateTemplateMenuItemDto,
    UpdateTemplateMenuItemDto,
    NestedCreateTemplateMenuItemDto,
    NestedUpdateTemplateMenuItemDto
>;

/**
 * A row item on a {@link Template} representing a {@link MenuItem}
 */
@Entity()
export class TemplateMenuItem {
    @ApiProperty({
        example: 1,
        description: 'The unique identifier of the entity',
    })
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * The name value to be displayed on the row, representing the referenced {@link MenuItem}
     */
    @ApiProperty({
        example: 'CLAPPLE',
        description: 'Name to be printed on document representing the MenuItem',
    })
    @Column()
    displayName: string;

    /**
     * The position along the column the row exists. A 1-based index.
     */
    @ApiProperty({
        example: 1,
        description:
            'A 1-based index specifying the row order of this template item on the template (1 being the first row at the top ignoring the header row)',
    })
    @Column()
    @Check(`"tablePosIndex" >= 1`)
    tablePosIndex: number;

    /**
     * The referenced {@link MenuItem} for the row.
     */
    @ApiProperty({
        example: menuItemExample(new Set<string>(), true),
        description:
            'The item being represented in the template item (as a row on the template)',
        type: MenuItem,
    })
    @ManyToOne(() => MenuItem, { onDelete: 'CASCADE' })
    menuItem: MenuItem;

    /**
     * The parent {@link Template}.
     */
    @ApiProperty({
        example: templateExample(new Set<string>(), true),
        description: 'The template this template item is for',
        type: () => Template,
    })
    @ManyToOne(() => Template, (template) => template.templateMenuItems, {
        orphanedRowAction: 'delete',
        onDelete: 'CASCADE',
    })
    parentTemplate: Template;
}
