import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Controller, Inject } from '@nestjs/common';
import { Cache } from "cache-manager";
import { ControllerBase } from '../../../base/controller-base';
import { RequestContextService } from '../../request-context/RequestContextService';
import { AppLogger } from '../../app-logging/app-logger';
import { Template } from '../entities/template.entity';
import { TemplateService } from '../services/template.service';

@Controller('templates')
export class TemplateController extends ControllerBase<Template>{
  constructor(
    templateService: TemplateService, 
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) { super(templateService, cacheManager, 'TemplateController', requestContextService, logger); }
}