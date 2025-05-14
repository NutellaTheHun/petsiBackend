import { Controller, Inject } from '@nestjs/common';
import { UnitCategory } from '../entities/unit-category.entity';
import { UnitCategoryService } from '../services/unit-category.service';
import { ControllerBase } from '../../../base/controller-base';
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Logger } from "nestjs-pino";
import { RequestContextService } from '../../request-context/RequestContextService';
import { ModuleRef } from '@nestjs/core';
import { AppLogger } from '../../app-logging/app-logger';

@Controller('unit-category')
export class UnitCategoryController extends ControllerBase<UnitCategory> {
  constructor(
    categoryService: UnitCategoryService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ){ super(categoryService, cacheManager, 'UnitCategoryController', requestContextService, logger); }
}