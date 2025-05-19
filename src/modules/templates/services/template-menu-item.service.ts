import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { TemplateMenuItemBuilder } from '../builders/template-menu-item.builder';
import { CreateTemplateMenuItemDto } from '../dto/template-menu-item/create-template-menu-item.dto';
import { TemplateMenuItem } from '../entities/template-menu-item.entity';
import { Template } from '../entities/template.entity';
import { TemplateMenuItemValidator } from '../validators/template-menu-item.validator';

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

  /**
   * Depreciated, only created as a child through {@link Template}.
   */
  public async create(dto: CreateTemplateMenuItemDto): Promise<TemplateMenuItem> {
      throw new BadRequestException();
  }
}