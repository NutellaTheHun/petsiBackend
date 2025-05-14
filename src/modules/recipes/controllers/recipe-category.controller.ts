import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Controller, Inject } from '@nestjs/common';
import { Cache } from "cache-manager";
import { ControllerBase } from '../../../base/controller-base';
import { RequestContextService } from '../../request-context/RequestContextService';
import { AppLogger } from '../../app-logging/app-logger';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { RecipeCategoryService } from '../services/recipe-category.service';

@Controller('recipe-category')
export class RecipeCategoryController extends ControllerBase<RecipeCategory> {
    constructor(
        categoryService: RecipeCategoryService, 
        @Inject(CACHE_MANAGER) cacheManager: Cache,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ){ super(categoryService, cacheManager,'RecipeCategoryController', requestContextService, logger); }
}