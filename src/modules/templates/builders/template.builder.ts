import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { BuilderBase } from '../../../base/builder-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateTemplateMenuItemDto } from '../dto/template-menu-item/create-template-menu-item.dto';
import { NestedTemplateMenuItemDto } from '../dto/template-menu-item/nested-template-menu-item.dto copy';
import { CreateTemplateDto } from '../dto/template/create-template.dto';
import { UpdateTemplateDto } from '../dto/template/update-template.dto';
import { Template } from '../entities/template.entity';
import { TemplateValidator } from '../validators/template.validator';
import { TemplateMenuItemBuilder } from './template-menu-item.builder';

@Injectable()
export class TemplateBuilder extends BuilderBase<Template> {
  constructor(
    @Inject(forwardRef(() => TemplateMenuItemBuilder))
    private readonly itemBuilder: TemplateMenuItemBuilder,

    validator: TemplateValidator,
    requestContextService: RequestContextService,
    logger: AppLogger,
  ) {
    super(
      Template,
      'TemplateBuilder',
      requestContextService,
      logger,
      validator,
    );
  }

  protected createEntity(dto: CreateTemplateDto): void {
    if (dto.isPie !== undefined) {
      this.isPie(dto.isPie);
    }
    if (dto.templateName !== undefined) {
      this.name(dto.templateName);
    }
    if (dto.templateItemDtos !== undefined) {
      this.itemsByBuilder(dto.templateItemDtos);
    }
  }

  protected updateEntity(dto: UpdateTemplateDto): void {
    if (dto.isPie !== undefined) {
      this.isPie(dto.isPie);
    }
    if (dto.templateName !== undefined) {
      this.name(dto.templateName);
    }
    if (dto.templateItemDtos !== undefined) {
      this.itemsByBuilder(dto.templateItemDtos);
    }
  }

  public name(name: string): this {
    return this.setPropByVal('templateName', name);
  }

  public isPie(val: boolean): this {
    return this.setPropByVal('isPie', val);
  }

  public itemsByBuilder(
    dtos: (CreateTemplateMenuItemDto | NestedTemplateMenuItemDto)[],
  ): this {
    return this.setPropByBuilder(
      this.itemBuilder.buildMany.bind(this.itemBuilder),
      'templateItems',
      this.entity,
      dtos,
    );
  }
}
