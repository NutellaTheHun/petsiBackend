import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { TemplateMenuItemBuilder } from '../builders/template-menu-item.builder';
import { TemplateMenuItem } from '../entities/template-menu-item.entity';
import { TemplateMenuItemValidator } from '../validators/template-menu-item.validator';
import { RequestContextService } from '../../request-context/RequestContextService';
import { ModuleRef } from '@nestjs/core';
import { AppLogger } from '../../app-logging/app-logger';

@Injectable()
export class TemplateMenuItemService extends ServiceBase<TemplateMenuItem> {
  constructor(
    @InjectRepository(TemplateMenuItem)
    itemRepo: Repository<TemplateMenuItem>,

    @Inject(forwardRef(() => TemplateMenuItemBuilder))
    itemBuilder: TemplateMenuItemBuilder,

    validator: TemplateMenuItemValidator,
    requestContextService: RequestContextService,
    logger: AppLogger,
  ){ super(itemRepo, itemBuilder, validator, 'TemplateMenuItemService', requestContextService, logger); }
}