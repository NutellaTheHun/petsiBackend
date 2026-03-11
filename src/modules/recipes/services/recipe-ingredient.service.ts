import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../common/base/service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateRecipeIngredientDto } from '../dto/recipe-ingredient/create-recipe-ingredient.dto';
import { UpdateRecipeIngredientDto } from '../dto/recipe-ingredient/update-recipe-ingedient.dto';
import {
    RecipeIngredient,
    RecipeIngredientEntity,
} from '../entities/recipe-ingredient.entity';
import { RecipeIngredientComposer } from '../utils/composers/recipe-ingredient.composer';
import { RecipeIngredientValidator } from '../validators/recipe-ingredient.validator';

@Injectable()
export class RecipeIngredientService extends ServiceBase<RecipeIngredientEntity> {
    constructor(
        @InjectRepository(RecipeIngredient)
        repo: Repository<RecipeIngredient>,
        requestContextService: RequestContextService,
        logger: AppLogger,
        validator: RecipeIngredientValidator,

        private readonly ingredientComposer: RecipeIngredientComposer,
    ) {
        super(
            repo,
            'RecipeIngredientService',
            requestContextService,
            logger,
            validator,
        );
    }

    protected async createEntity(
        dto: CreateRecipeIngredientDto,
        manager: EntityManager,
    ): Promise<RecipeIngredient> {
        return await manager.save(
            await this.ingredientComposer.composeCreate(dto, manager),
        );
    }

    protected async updateEntity(
        dto: UpdateRecipeIngredientDto,
        manager: EntityManager,
        entity: RecipeIngredient,
    ): Promise<void> {
        await this.ingredientComposer.composeUpdate(dto, manager, entity)
        await manager.save(entity);
    }

    protected applySortBy(
        query: SelectQueryBuilder<RecipeIngredient>,
        sortBy: string,
        sortOrder: 'ASC' | 'DESC',
    ): void {
        if (sortBy === 'ingredient') {
            query
                .leftJoinAndSelect('entity.ingredientInventoryItem', 'inventoryItem')
                .leftJoinAndSelect('entity.ingredientRecipe', 'recipe');

            query.orderBy(`COALESCE(inventoryItem.name, recipe.name)`, sortOrder);
        }
    }

    // filter by recipe
    protected applyFilters(
        query: SelectQueryBuilder<RecipeIngredient>,
        filters: Record<string, string[]>,
    ): void {
        if (filters.parentRecipe && filters.parentRecipe.length > 0) {
            query.andWhere('entity.parentRecipe IN (:...parentRecipes)', {
                parentRecipes: filters.parentRecipe,
            });
        }
    }
}
