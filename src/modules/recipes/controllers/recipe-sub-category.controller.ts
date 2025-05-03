import { Controller, Inject } from '@nestjs/common';
import { ControllerBase } from '../../../base/controller-base';
import { RecipeSubCategory } from '../entities/recipe-sub-category.entity';
import { RecipeSubCategoryService } from '../services/recipe-sub-category.service';
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Logger } from "nestjs-pino";

@Controller('recipe-sub-category')
export class RecipeSubCategoryController extends ControllerBase<RecipeSubCategory>{
    constructor(
        subCategoryService: RecipeSubCategoryService,
        @Inject(CACHE_MANAGER) cacheManager: Cache,
        @Inject(Logger)logger: Logger,
    ){ super(subCategoryService, cacheManager, logger); }
}