import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../common/base/service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { InventoryItemService } from '../../inventory-items/services/inventory-item.service';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateRecipeIngredientDto } from '../dto/recipe-ingredient/create-recipe-ingredient.dto';
import { UpdateRecipeIngredientDto } from '../dto/recipe-ingredient/update-recipe-ingedient.dto';
import {
  RecipeIngredient,
  RecipeIngredientEntity,
} from '../entities/recipe-ingredient.entity';
import { RecipeIngredientComposer } from '../utils/composers/recipe-ingredient.composer';
import { RecipeIngredientValidator } from '../validators/recipe-ingredient.validator';
import { RecipeService } from './recipe.service';

@Injectable()
export class RecipeIngredientService extends ServiceBase<RecipeIngredientEntity> {
  constructor(
    @InjectRepository(RecipeIngredient)
    private readonly repo: Repository<RecipeIngredient>,
    @Inject(forwardRef(() => RecipeService))
    private readonly recipeService: RecipeService,

    private readonly inventoryItemService: InventoryItemService,

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
    return await this.ingredientComposer.composeCreate(dto, manager);
  }

  protected async updateEntity(
    dto: UpdateRecipeIngredientDto,
    manager: EntityManager,
    entity: RecipeIngredient,
  ): Promise<void> {
    await this.ingredientComposer.composeUpdate(dto, manager, entity);
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
}
