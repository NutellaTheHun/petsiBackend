import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { BuilderBase } from '../../../common/base/builder.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateTemplateMenuItemDto } from '../dto/template-menu-item/create-template-menu-item.dto';
import { NestedCreateTemplateMenuItemDto } from '../dto/template-menu-item/nested-create-template-menu-item.dto';
import { NestedUpdateTemplateMenuItemDto } from '../dto/template-menu-item/nested-update-template-menu-item.dto';
import { CreateTemplateDto } from '../dto/template/create-template.dto';
import { UpdateTemplateDto } from '../dto/template/update-template.dto';
import { Template } from '../entities/template.entity';
import { TemplateMenuItemBuilder } from './template-menu-item.builder';

@Injectable()
export class TemplateBuilder extends BuilderBase<Template> {
    constructor(
        @Inject(forwardRef(() => TemplateMenuItemBuilder))
        private readonly itemBuilder: TemplateMenuItemBuilder,

        requestContextService: RequestContextService,
        logger: AppLogger,
    ) {
        super(Template, 'TemplateBuilder', requestContextService, logger);
    }

    protected createEntity(dto: CreateTemplateDto): void {
        if (dto.name !== undefined) {
            this.name(dto.name);
        }
        if (dto.templateMenuItems !== undefined) {
            this.itemsByBuilder(dto.templateMenuItems);
        }
    }

    protected updateEntity(dto: UpdateTemplateDto): void {
        if (dto.name !== undefined) {
            this.name(dto.name);
        }
        if (dto.templateMenuItems !== undefined) {
            this.itemsByBuilder(dto.templateMenuItems);
        }
    }

    public name(name: string): this {
        return this.setPropByVal('name', name);
    }

    public itemsByBuilder(
        dtos: (
            | CreateTemplateMenuItemDto
            | NestedCreateTemplateMenuItemDto
            | NestedUpdateTemplateMenuItemDto
        )[],
    ): this {
        return this.setPropByBuilder(
            this.itemBuilder.buildMany.bind(this.itemBuilder),
            'templateMenuItems',
            this.entity,
            dtos,
        );
    }
}
