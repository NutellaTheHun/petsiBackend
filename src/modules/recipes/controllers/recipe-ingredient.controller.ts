import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Controller, Inject } from '@nestjs/common';
import { Cache } from "cache-manager";
import { ControllerBase } from '../../../base/controller-base';
import { RequestContextService } from '../../request-context/RequestContextService';
import { RecipeIngredient } from '../entities/recipe-ingredient.entity';
import { RecipeIngredientService } from '../services/recipe-ingredient.service';
import { AppLogger } from '../../app-logging/app-logger';


@Controller('recipe-ingredient')
export class RecipeIngredientController extends ControllerBase<RecipeIngredient>{
    constructor(
        ingredientService: RecipeIngredientService,
        @Inject(CACHE_MANAGER) cacheManager: Cache,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ){ super(ingredientService, cacheManager, 'RecipeIngredientController', requestContextService, logger); }
}