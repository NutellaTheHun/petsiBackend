import { Controller, Inject } from '@nestjs/common';
import { ControllerBase } from '../../../base/controller-base';
import { Recipe } from '../entities/recipe.entity';
import { RecipeService } from '../services/recipe.service';
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Logger } from "nestjs-pino";
import { RequestContextService } from '../../request-context/RequestContextService';
import { ModuleRef } from '@nestjs/core';
import { AppLogger } from '../../app-logging/app-logger';


@Controller('recipe')
export class RecipeController extends ControllerBase<Recipe>{
    constructor(
        recipeService: RecipeService,
        @Inject(CACHE_MANAGER) cacheManager: Cache,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ){ super(recipeService, cacheManager, 'RecipeController', requestContextService, logger); }
}