import { Controller, Inject } from '@nestjs/common';
import { UnitCategory } from '../entities/unit-category.entity';
import { UnitCategoryService } from '../services/unit-category.service';
import { ControllerBase } from '../../../base/controller-base';
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Logger } from "nestjs-pino";

@Controller('unit-category')
export class UnitCategoryController extends ControllerBase<UnitCategory> {
  constructor(
      categoryService: UnitCategoryService,
      @Inject(CACHE_MANAGER) cacheManager: Cache,
      @Inject(Logger)logger: Logger,
  ){ super(categoryService, cacheManager, logger); }
}