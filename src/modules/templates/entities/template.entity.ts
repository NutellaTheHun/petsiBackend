import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { EntityBase } from '../../../base/entity-base';
import { templateMenuItemExample } from '../../../util/swagger-examples/templates/template-menu-item.example';
import { CreateTemplateDto } from '../dto/template/create-template.dto';
import { UpdateTemplateDto } from '../dto/template/update-template.dto';
import { TemplateMenuItem } from './template-menu-item.entity';

export type TemplateEntity = EntityBase<
  Template,
  CreateTemplateDto,
  UpdateTemplateDto
>;

/**
 * A list of {@link TemplateMenuItem} to build forms used for baking lists.
 *
 * Per buisness logic, templates display either pie or pastry products.
 */
@Entity()
export class Template {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the entity',
  })
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Example: "Summer Pies", "Spring Pastries"
   */
  @ApiProperty({ example: 'Spring Pies', description: 'Name of the template' })
  @Column({ unique: true })
  name: string;

  /**
   * Differentiates whether the template is for pie products or not.
   */
  @ApiProperty({
    example: true,
    description:
      'Differentiates whether the template is for pie products or not.',
  })
  @Column({ default: false })
  isPie: boolean = false;

  /**
   * List of {@link TemplateMenuItem} that describe the form structure.
   */
  @ApiProperty({
    example: [templateMenuItemExample(new Set<string>(), false)],
    description:
      'A list of template items representing the rows of the printed template',
    type: () => TemplateMenuItem,
    isArray: true,
  })
  @OneToMany(
    () => TemplateMenuItem,
    (templateItem) => templateItem.parentTemplate,
    { cascade: true },
  )
  templateMenuItems: TemplateMenuItem[] = [];
}
