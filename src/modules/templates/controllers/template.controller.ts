import { Controller, Inject } from '@nestjs/common';
import { ControllerBase } from '../../../base/controller-base';
import { Template } from '../entities/template.entity';
import { TemplateService } from '../services/template.service';
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Logger } from "nestjs-pino";

@Controller('templates')
export class TemplateController extends ControllerBase<Template>{
  constructor(
    templateService: TemplateService, 
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    @Inject(Logger)logger: Logger,
  ) { super(templateService, cacheManager, logger); }
}