import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BuilderBase } from '../../../common/base/builder.base';
import { AppLogger } from '../../app-logging/app-logger';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateTemplateMenuItemDto } from '../dto/template-menu-item/create-template-menu-item.dto';
import { NestedCreateTemplateMenuItemDto } from '../dto/template-menu-item/nested-create-template-menu-item.dto';
import { NestedUpdateTemplateMenuItemDto } from '../dto/template-menu-item/nested-update-template-menu-item.dto';
import { UpdateTemplateMenuItemDto } from '../dto/template-menu-item/update-template-menu-item.dto';
import { TemplateMenuItem } from '../entities/template-menu-item.entity';
import { Template } from '../entities/template.entity';

@Injectable()
export class TemplateMenuItemBuilder extends BuilderBase<TemplateMenuItem> {
  constructor(
    @InjectRepository(Template)
    private readonly templateRepo: Repository<Template>,

    @InjectRepository(TemplateMenuItem)
    private readonly templateItemRepo: Repository<TemplateMenuItem>,

    @InjectRepository(MenuItem)
    private readonly menuItemRepo: Repository<MenuItem>,

    requestContextService: RequestContextService,
    logger: AppLogger,
  ) {
    super(
      TemplateMenuItem,
      'TemplateMenuItemBuilder',
      requestContextService,
      logger,
    );
  }

  protected createEntity(
    dto: CreateTemplateMenuItemDto,
    parent?: Template,
  ): void {
    // If the templateId is provided, use it to set the parentTemplate. (Through template-menu-item endpoint)
    // If the templateId is not provided, but a parent is provided, use the parent to set the parentTemplate. (Through create template endpoint)
    if (parent) {
      this.setPropByVal('parentTemplate', parent);
    } else if (dto.parentTemplateId !== undefined) {
      this.parentTemplateById(dto.parentTemplateId);
    }

    if (dto.displayName !== undefined) {
      this.displayName(dto.displayName);
    }
    if (dto.menuItemId !== undefined) {
      this.menuItemById(dto.menuItemId);
    }
    if (dto.tablePosIndex !== undefined) {
      this.tablePosIndex(dto.tablePosIndex);
    }
  }

  protected updateEntity(dto: UpdateTemplateMenuItemDto): void {
    if (dto.displayName !== undefined) {
      this.displayName(dto.displayName);
    }
    if (dto.menuItemId !== undefined) {
      this.menuItemById(dto.menuItemId);
    }
    if (dto.tablePosIndex !== undefined) {
      this.tablePosIndex(dto.tablePosIndex);
    }
  }

  public async buildMany(
    parent: Template,
    dtos: (
      | CreateTemplateMenuItemDto
      | NestedCreateTemplateMenuItemDto
      | NestedUpdateTemplateMenuItemDto
    )[],
  ): Promise<TemplateMenuItem[]> {
    const results: TemplateMenuItem[] = [];
    for (const dto of dtos) {
      if (dto instanceof CreateTemplateMenuItemDto) {
        results.push(await this.buildCreateDto(dto));
      } else {
        if ('createId' in dto) {
          results.push(await this.buildCreateDto(dto, parent, dto.createId));
        }
        if ('id' in dto) {
          const item = await this.templateItemRepo.findOne({
            where: { id: dto.id },
          });
          if (!item) {
            throw new Error('recipe ingredient not found');
          }
          results.push(await this.buildUpdateDto(item, dto));
        }
      }
    }
    return results;
  }

  public displayName(name: string): this {
    return this.setPropByVal('displayName', name);
  }

  public menuItemById(id: number): this {
    return this.setPropById(
      async (id: number) => await this.menuItemRepo.findOne({ where: { id } }),
      'menuItem',
      id,
    );
  }

  public menuItemByName(name: string): this {
    return this.setPropByName(
      async (name: string) =>
        await this.menuItemRepo.findOne({ where: { name } }),
      'menuItem',
      name,
    );
  }

  public tablePosIndex(pos: number): this {
    return this.setPropByVal('tablePosIndex', pos);
  }

  public parentTemplateById(id: number): this {
    return this.setPropById(
      async (id: number) => await this.templateRepo.findOne({ where: { id } }),
      'parentTemplate',
      id,
    );
  }

  public parentTemplateByName(name: string): this {
    return this.setPropByName(
      async (name: string) =>
        await this.templateRepo.findOne({ where: { name } }),
      'parentTemplate',
      name,
    );
  }
}
