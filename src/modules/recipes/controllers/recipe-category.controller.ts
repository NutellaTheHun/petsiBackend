import { Controller, Inject } from '@nestjs/common';
import { ControllerBase } from '../../../base/controller-base';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { RecipeCategoryService } from '../services/recipe-category.service';
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Controller('recipe-category')
export class RecipeCategoryController extends ControllerBase<RecipeCategory> {
    constructor(
        categoryService: RecipeCategoryService, 
        @Inject(CACHE_MANAGER) cacheManager: Cache
    ){ super(categoryService, cacheManager); }
}