import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository, SelectQueryBuilder } from 'typeorm';
import { ChangeDetectorBase } from '../../../common/base/change-detector.base';
import { ServiceBase } from '../../../common/base/service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateRecipeDto } from '../dto/recipe/create-recipe.dto';
import { UpdateRecipeDto } from '../dto/recipe/update-recipe-dto';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { RecipeIngredient } from '../entities/recipe-ingredient.entity';
import { RecipeSubCategory } from '../entities/recipe-sub-category.entity';
import { Recipe, RecipeEntity } from '../entities/recipe.entity';
import { RecipeIngredientComposer } from '../utils/composers/recipe-ingredient.composer';
import { RecipeChangeDetector } from '../utils/change-detectors/recipe.change-detector';
import { RecipeValidator } from '../validators/recipe.valdiator';

@Injectable()
export class RecipeService extends ServiceBase<RecipeEntity> {
    constructor(
        @InjectRepository(Recipe)
        repo: Repository<Recipe>,
        requestContextService: RequestContextService,
        logger: AppLogger,
        validator: RecipeValidator,

        private readonly ingredientComposer: RecipeIngredientComposer,
        private readonly recipeChangeDetector: RecipeChangeDetector,
    ) {
        super(repo, 'RecipeService', requestContextService, logger, validator);
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

            batchResultUnit: dto.batchResultUnit ?? null,

            servingSizeQuantity: dto.servingSizeQuantity
                ? dto.servingSizeQuantity
                : null,

            servingSizeUnit: dto.servingSizeUnit ?? null,

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
        if (dto.batchResultUnit !== undefined) {
            entity.batchResultUnit = dto.batchResultUnit ?? null;
        }

        if (dto.batchResultQuantity !== undefined) {
            if (dto.batchResultQuantity === null) {
                entity.batchResultQuantity = null;
            } else {
                entity.batchResultQuantity = dto.batchResultQuantity;
            }
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
            if (dto.salesPrice === null) {
                entity.salesPrice = null;
            } else {
                entity.salesPrice = dto.salesPrice.toString();
            }
        }

        if (dto.servingSizeUnit !== undefined) {
            entity.servingSizeUnit = dto.servingSizeUnit ?? null;
        }

        if (dto.servingSizeQuantity !== undefined) {
            if (dto.servingSizeQuantity === null) {
                entity.servingSizeQuantity = null;
            } else {
                entity.servingSizeQuantity = dto.servingSizeQuantity;
            }
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

        if (dto.ingredients !== undefined) {
            const existingIngreds = await manager.find(RecipeIngredient, {
                where: { parentRecipe: { id: entity.id } },
            });

            const incomingIds = dto.ingredients
                .map((i: any) => ('id' in i ? i.id : undefined))
                .filter((id: any): id is number => typeof id === 'number');

            const idsToRemove = existingIngreds
                .map((i) => i.id)
                .filter((id) => !incomingIds.includes(id));

            if (idsToRemove.length) {
                await manager.delete(RecipeIngredient, { id: In(idsToRemove) });
            }

            entity.ingredients =
                await this.ingredientComposer.composeManyNestedEntity(
                    dto.ingredients,
                    manager,
                    existingIngreds.filter((i) => !idsToRemove.includes(i.id)),
                    { parentRecipeId: entity.id },
                );
        }

        await manager.save(entity);
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
            LOWER(entity.name) LIKE :search
            OR LOWER(inventoryItem.name) LIKE :search
            OR LOWER(subRecipe.name) LIKE :search
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
        if (sortBy === 'name') {
            query.orderBy(`entity.${sortBy}`, sortOrder);
        } else if (sortBy === 'category') {
            query.leftJoinAndSelect('entity.category', 'category');
            query.orderBy(`category.name`, sortOrder, 'NULLS LAST');
        } else if (sortBy === 'subCategory') {
            query.leftJoinAndSelect('entity.subCategory', 'subCategory');
            query.orderBy(`subCategory.name`, sortOrder, 'NULLS LAST');
        }
    }

    protected getChangeDetector(): ChangeDetectorBase<Recipe, UpdateRecipeDto> | undefined {
        return this.recipeChangeDetector;
    }

    protected getUpdateDiffRelations(): string[] {
        return [
            'producedMenuItem',
            'category',
            'subCategory',
            'ingredients',
            'ingredients.ingredientInventoryItem',
            'ingredients.ingredientRecipe',
        ];
    }
}
