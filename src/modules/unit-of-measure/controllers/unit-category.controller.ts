import { Controller, Inject } from '@nestjs/common';
import { UnitCategory } from '../entities/unit-category.entity';
import { UnitCategoryService } from '../services/unit-category.service';
import { ControllerBase } from '../../../base/controller-base';
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Controller('unit-category')
export class UnitCategoryController extends ControllerBase<UnitCategory> {
  constructor(
      /*private readonly */categoryService: UnitCategoryService,
      @Inject(CACHE_MANAGER) cacheManager: Cache
  ){ super(categoryService, cacheManager); }
}
