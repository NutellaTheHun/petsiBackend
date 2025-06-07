import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { Template } from './template.entity';

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
  @Column({ nullable: false })
  displayName: string;

  /**
   * The referenced {@link MenuItem} for the row.
   */
  @ApiProperty({
    example: {},
    description:
      'The item being represented in the template item (as a row on the template)',
    type: MenuItem,
  })
  @ManyToOne(() => MenuItem, { nullable: false, onDelete: 'CASCADE' })
  menuItem: MenuItem;

  /**
   * The position along the column the row exists.
   */
  @ApiProperty({
    example: 0,
    description:
      'The index specifying the row order of this template item on the template (0 being the first row at the top ignoring the header row)',
  })
  @Column({ nullable: false })
  tablePosIndex: number;

  /**
   * The parent {@link Template}.
   */
  @ApiProperty({
    example: {},
    description: 'The template this template item is for',
    type: () => Template,
  })
  @ManyToOne(() => Template, (template) => template.templateItems, {
    orphanedRowAction: 'delete',
    onDelete: 'CASCADE',
  })
  parentTemplate: Template;
}
