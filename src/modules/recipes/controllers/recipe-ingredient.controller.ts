import { Controller, Inject } from '@nestjs/common';
import { ControllerBase } from '../../../base/controller-base';
import { RecipeIngredient } from '../entities/recipe-ingredient.entity';
import { RecipeIngredientService } from '../services/recipe-ingredient.service';
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Logger } from "nestjs-pino";

@Controller('recipe-ingredient')
export class RecipeIngredientController extends ControllerBase<RecipeIngredient>{
    constructor(
        ingredientService: RecipeIngredientService,
        @Inject(CACHE_MANAGER) cacheManager: Cache,
        @Inject(Logger)logger: Logger,
    ){ super(ingredientService, cacheManager, logger); }
}