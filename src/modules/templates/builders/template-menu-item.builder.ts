import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { BuilderBase } from '../../../base/builder-base';
import { AppLogger } from '../../app-logging/app-logger';
import { MenuItemService } from '../../menu-items/services/menu-item.service';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateTemplateMenuItemDto } from '../dto/template-menu-item/create-template-menu-item.dto';
import { NestedTemplateMenuItemDto } from '../dto/template-menu-item/nested-template-menu-item.dto copy';
import { UpdateTemplateMenuItemDto } from '../dto/template-menu-item/update-template-menu-item.dto';
import { TemplateMenuItem } from '../entities/template-menu-item.entity';
import { Template } from '../entities/template.entity';
import { TemplateMenuItemService } from '../services/template-menu-item.service';
import { TemplateService } from '../services/template.service';
import { TemplateMenuItemValidator } from '../validators/template-menu-item.validator';

@Injectable()
export class TemplateMenuItemBuilder extends BuilderBase<TemplateMenuItem> {
  constructor(
    @Inject(forwardRef(() => TemplateService))
    private readonly templateService: TemplateService,

    @Inject(forwardRef(() => TemplateMenuItemService))
    private readonly templateItemService: TemplateMenuItemService,

    private menuItemService: MenuItemService,

    validator: TemplateMenuItemValidator,
    requestContextService: RequestContextService,
    logger: AppLogger,
  ) {
    super(
      TemplateMenuItem,
      'TemplateMenuItemBuilder',
      requestContextService,
      logger,
      validator,
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
    } else if (dto.templateId !== undefined) {
      this.parentTemplateById(dto.templateId);
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
    dtos: (CreateTemplateMenuItemDto | NestedTemplateMenuItemDto)[],
  ): Promise<TemplateMenuItem[]> {
    const results: TemplateMenuItem[] = [];
    for (const dto of dtos) {
      if (dto instanceof CreateTemplateMenuItemDto) {
        results.push(await this.buildCreateDto(dto));
      } else {
        if (dto.create) {
          results.push(await this.buildCreateDto(dto, parent));
        }
        if (dto.update) {
          const item = await this.templateItemService.findOne(dto.update.id);
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
      this.menuItemService.findOne.bind(this.menuItemService),
      'menuItem',
      id,
    );
  }

  public menuItemByName(name: string): this {
    return this.setPropByName(
      this.menuItemService.findOneByName.bind(this.menuItemService),
      'menuItem',
      name,
    );
  }

  public tablePosIndex(pos: number): this {
    return this.setPropByVal('tablePosIndex', pos);
  }

  public parentTemplateById(id: number): this {
    return this.setPropById(
      this.templateService.findOne.bind(this.templateService),
      'parentTemplate',
      id,
    );
  }

  public parentTemplateByName(name: string): this {
    return this.setPropByName(
      this.templateService.findOneByName.bind(this.templateService),
      'parentTemplate',
      name,
    );
  }
}
