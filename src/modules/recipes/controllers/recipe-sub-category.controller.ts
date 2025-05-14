import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Controller, Inject } from '@nestjs/common';
import { Cache } from "cache-manager";
import { ControllerBase } from '../../../base/controller-base';
import { RequestContextService } from '../../request-context/RequestContextService';
import { AppLogger } from '../../app-logging/app-logger';
import { RecipeSubCategory } from '../entities/recipe-sub-category.entity';
import { RecipeSubCategoryService } from '../services/recipe-sub-category.service';


@Controller('recipe-sub-category')
export class RecipeSubCategoryController extends ControllerBase<RecipeSubCategory>{
    constructor(
        subCategoryService: RecipeSubCategoryService,
        @Inject(CACHE_MANAGER) cacheManager: Cache,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ){ super(subCategoryService, cacheManager, 'RecipeSubCategoryController', requestContextService, logger); }
}