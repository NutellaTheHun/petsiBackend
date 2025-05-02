import { Controller, Inject } from '@nestjs/common';
import { ControllerBase } from '../../../base/controller-base';
import { RecipeIngredient } from '../entities/recipe-ingredient.entity';
import { RecipeIngredientService } from '../services/recipe-ingredient.service';
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Controller('recipe-ingredient')
export class RecipeIngredientController extends ControllerBase<RecipeIngredient>{
    constructor(
        ingredientService: RecipeIngredientService,
        @Inject(CACHE_MANAGER) cacheManager: Cache
    ){ super(ingredientService, cacheManager); }
}