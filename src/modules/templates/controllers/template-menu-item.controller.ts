import { Controller, Inject } from '@nestjs/common';
import { ControllerBase } from '../../../base/controller-base';
import { TemplateMenuItem } from '../entities/template-menu-item.entity';
import { TemplateMenuItemService } from '../services/template-menu-item.service';
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Controller('template-menu-items')
export class TemplateMenuItemController extends ControllerBase<TemplateMenuItem>{
  constructor(
    templateService: TemplateMenuItemService,
    @Inject(CACHE_MANAGER) cacheManager: Cache
  ) { super(templateService, cacheManager); }
}