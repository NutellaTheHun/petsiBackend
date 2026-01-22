import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../common/base/service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { MenuItem } from '../../menu-items/menu-items.module';
import { RequestContextService } from '../../request-context/RequestContextService';
import { UnitOfMeasure } from '../../unit-of-measure/entities/unit-of-measure.entity';
import { RecipeBuilder } from '../builders/recipe.builder';
import { CreateRecipeDto } from '../dto/recipe/create-recipe.dto';
import { UpdateRecipeDto } from '../dto/recipe/update-recipe-dto';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { RecipeIngredient } from '../entities/recipe-ingredient.entity';
import { RecipeSubCategory } from '../entities/recipe-sub-category.entity';
import { Recipe, RecipeEntity } from '../entities/recipe.entity';
import { RecipeIngredientComposer } from '../utils/composers/recipe-ingredient.composer';
import { RecipeValidator } from '../validators/recipe.valdiator';

@Injectable()
export class RecipeService extends ServiceBase<RecipeEntity> {
  constructor(
    @InjectRepository(Recipe)
    private readonly repo: Repository<Recipe>,

    @Inject(forwardRef(() => RecipeBuilder))
    builder: RecipeBuilder,

    requestContextService: RequestContextService,
    logger: AppLogger,
    validator: RecipeValidator,
    private readonly ingredientComposer: RecipeIngredientComposer,
  ) {
    super(
      repo,
      builder,
      'RecipeService',
      requestContextService,
      logger,
      validator,
    );
  }

  protected async createEntity(
    dto: CreateRecipeDto,
    manager: EntityManager,
  ): Promise<Recipe> {
    const result = manager.create(Recipe, {
      name: dto.name,

      isIngredient: dto.isIngredient,

      producedMenuItem: dto.producedMenuItemId
        ? { id: dto.producedMenuItemId }
        : null,

      batchResultQuantity: dto.batchResultQuantity
        ? dto.batchResultQuantity
        : null,

      batchResultUnitType: dto.batchResultUnitTypeId
        ? { id: dto.batchResultUnitTypeId }
        : null,

      servingSizeQuantity: dto.servingSizeQuantity
        ? dto.servingSizeQuantity
        : null,

      servingSizeUnitType: dto.servingSizeUnitTypeId
        ? { id: dto.servingSizeUnitTypeId }
        : null,

      salesPrice: dto.salesPrice ? dto.salesPrice.toString() : null,

      category: dto.categoryId ? { id: dto.categoryId } : null,

      subCategory: dto.subCategoryId ? { id: dto.subCategoryId } : null,
    });

    const savedResult = await manager.save(result);

    if (dto.ingredients?.length) {
      savedResult.ingredients =
        await this.ingredientComposer.composeManyNestedEntity(
          dto.ingredients,
          manager,
          [],
          { parentRecipeId: savedResult.id },
        );
      await manager.save(result);
    }

    return savedResult;
  }

  protected async updateEntity(
    dto: UpdateRecipeDto,
    manager: EntityManager,
    entity: Recipe,
  ): Promise<void> {
    if (dto.batchResultUnitTypeId !== undefined) {
      entity.batchResultUnitType = manager.create(UnitOfMeasure, {
        id: dto.batchResultUnitTypeId,
      });
    }

    if (dto.batchResultQuantity !== undefined) {
      entity.batchResultQuantity = dto.batchResultQuantity;
    }

    if (dto.categoryId !== undefined) {
      if (dto.categoryId === null) {
        entity.category = null;
      } else {
        entity.category = manager.create(RecipeCategory, {
          id: dto.categoryId,
        });

        if (dto.subCategoryId === undefined) {
          entity.subCategory = null;
        }
      }
    }

    if (dto.isIngredient !== undefined) {
      entity.isIngredient = dto.isIngredient;
    }

    if (dto.producedMenuItemId !== undefined) {
      if (dto.producedMenuItemId === null) {
        entity.producedMenuItem = null;
        // TODO: clear sales price?
      } else {
        entity.producedMenuItem = manager.create(MenuItem, {
          id: dto.producedMenuItemId,
        });
      }
    }

    if (dto.name !== undefined) {
      entity.name = dto.name;
    }

    if (dto.salesPrice !== undefined) {
      entity.salesPrice = dto.salesPrice.toString();
    }

    if (dto.servingSizeUnitTypeId !== undefined) {
      entity.servingSizeUnitType = manager.create(UnitOfMeasure, {
        id: dto.servingSizeUnitTypeId,
      });
    }

    if (dto.servingSizeQuantity !== undefined) {
      entity.servingSizeQuantity = dto.servingSizeQuantity;
    }

    if (dto.subCategoryId !== undefined) {
      if (dto.subCategoryId === null) {
        entity.subCategory = null;
      } else {
        entity.subCategory = manager.create(RecipeSubCategory, {
          id: dto.subCategoryId,
        });
      }
    }

    if (dto.ingredients?.length) {
      const existingIngreds = await manager.find(RecipeIngredient, {
        where: { parentRecipe: { id: entity.id } },
      });

      entity.ingredients =
        await this.ingredientComposer.composeManyNestedEntity(
          dto.ingredients,
          manager,
          existingIngreds,
          { parentRecipeId: entity.id },
        );
    }

    await manager.save(entity);
  }

  async findOneByName(
    name: string,
    relations?: Array<keyof Recipe>,
  ): Promise<Recipe | null> {
    return this.repo.findOne({ where: { name: name }, relations });
  }

  protected applySearch(
    query: SelectQueryBuilder<Recipe>,
    search: string,
  ): void {
    query
      .leftJoin('entity.ingredients', 'ingredient')
      .leftJoin('ingredient.ingredientInventoryItem', 'inventoryItem')
      .leftJoin('ingredient.ingredientRecipe', 'subRecipe')
      .andWhere(
        `
            LOWER(entity.recipeName) LIKE :search
            OR LOWER(inventoryItem.itemName) LIKE :search
            OR LOWER(subRecipe.recipeName) LIKE :search
        `,
        { search: `%${search.toLowerCase()}%` },
      );
  }

  protected applyFilters(
    query: SelectQueryBuilder<Recipe>,
    filters: Record<string, string[]>,
  ): void {
    if (filters.category && filters.category.length > 0) {
      query.andWhere('entity.category IN (:...categories)', {
        categories: filters.category,
      });
    }
    if (filters.subCategory && filters.subCategory.length > 0) {
      query.andWhere('entity.subCategory IN (:...subCategories)', {
        subCategories: filters.subCategory,
      });
    }
  }

  protected applySortBy(
    query: SelectQueryBuilder<Recipe>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    if (sortBy === 'recipeName') {
      query.orderBy(`entity.${sortBy}`, sortOrder);
    } else if (sortBy === 'category') {
      query.leftJoinAndSelect('entity.category', 'category');
      query.orderBy(`category.categoryName`, sortOrder, 'NULLS LAST');
    } else if (sortBy === 'subCategory') {
      query.leftJoinAndSelect('entity.subCategory', 'subCategory');
      query.orderBy(`subCategory.subCategoryName`, sortOrder, 'NULLS LAST');
    }
  }
}
