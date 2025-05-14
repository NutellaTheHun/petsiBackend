import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Controller, Inject } from '@nestjs/common';
import { Cache } from "cache-manager";
import { ControllerBase } from '../../../base/controller-base';
import { RequestContextService } from '../../request-context/RequestContextService';
import { AppLogger } from '../../app-logging/app-logger';
import { TemplateMenuItem } from '../entities/template-menu-item.entity';
import { TemplateMenuItemService } from '../services/template-menu-item.service';

@Controller('template-menu-items')
export class TemplateMenuItemController extends ControllerBase<TemplateMenuItem>{
  constructor(
    templateService: TemplateMenuItemService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) { super(templateService, cacheManager, 'TemplateMenuItemController', requestContextService, logger); }
}