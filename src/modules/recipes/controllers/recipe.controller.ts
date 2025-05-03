import { Controller, Inject } from '@nestjs/common';
import { ControllerBase } from '../../../base/controller-base';
import { Recipe } from '../entities/recipe.entity';
import { RecipeService } from '../services/recipe.service';
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Controller('recipe')
export class RecipeController extends ControllerBase<Recipe>{
    constructor(
        recipeService: RecipeService,
        @Inject(CACHE_MANAGER) cacheManager: Cache
    ){ super(recipeService, cacheManager); }
}