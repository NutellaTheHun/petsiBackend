import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationError } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateRecipeDto } from '../dto/recipe/create-recipe.dto';
import { UpdateRecipeDto } from '../dto/recipe/update-recipe-dto';
import { Recipe } from '../entities/recipe.entity';
import { RecipeCategoryService } from '../services/recipe-category.service';
import { RecipeService } from '../services/recipe.service';

@Injectable()
export class RecipeValidator extends ValidatorBase<Recipe> {
  constructor(
    @InjectRepository(Recipe)
    private readonly repo: Repository<Recipe>,

    @Inject(forwardRef(() => RecipeService))
    private readonly recipeService: RecipeService,

    @Inject(forwardRef(() => RecipeCategoryService))
    private readonly categoryService: RecipeCategoryService,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'Recipe', requestContextService, logger);
  }

  public async validateCreate(dto: CreateRecipeDto): Promise<void> {
    // Exists
    if (await this.helper.exists(this.repo, 'recipeName', dto.recipeName)) {
      this.addError({
        errorMessage: 'Recipe already exists.',
        errorType: 'EXIST',
        contextEntity: 'CreateRecipeDto',
        sourceEntity: 'Recipe',
        value: dto.recipeName,
      } as ValidationError);
    }

    // subcategory if category isnt assigned
    if (!dto.categoryId && dto.subCategoryId) {
      this.addError({
        errorMessage: 'Cannot assign a subcategory without a category',
        errorType: 'INVALID',
        contextEntity: 'CreateRecipeDto',
        sourceEntity: 'RecipeSubCategory',
        sourceId: dto.subCategoryId,
      } as ValidationError);
    }

    // Validate category / subcategory
    else if (dto.categoryId && dto.subCategoryId) {
      const category = await this.categoryService.findOne(dto.categoryId, [
        'subCategories',
      ]);
      if (!category.subCategories) {
        throw new Error('subcategories is null');
      }

      if (!category.subCategories.find((cat) => cat.id === dto.subCategoryId)) {
        this.addError({
          errorMessage: 'Invalid category / subcategory',
          errorType: 'INVALID',
          contextEntity: 'CreateRecipeDto',
          sourceEntity: 'RecipeSubCategory',
          sourceId: dto.subCategoryId,
          conflictEntity: 'RecipeCategory',
          conflictId: dto.categoryId,
        } as ValidationError);
      }
    }

    //No duplicate recipeIngredients
    if (dto.ingredientDtos) {
      const nestedCreateDtos = dto.ingredientDtos
        .map((nested) => nested.createDto)
        .filter((nested) => nested !== undefined);

      const resolvedDtos: string[] = [];
      for (const d of nestedCreateDtos) {
        if (d.ingredientInventoryItemId) {
          resolvedDtos.push(`I:${d.ingredientInventoryItemId}`);
        } else if (d.ingredientRecipeId) {
          resolvedDtos.push(`R:${d.ingredientRecipeId}`);
        }
      }
      const duplicateIngreds = this.helper.findDuplicates(
        resolvedDtos,
        (ingred) => `${ingred}`,
      );
      if (duplicateIngreds) {
        for (const dup of duplicateIngreds) {
          const [prefix, idStr] = dup.split(':');
          const ingredId = parseInt(idStr, 10);
          const entity = prefix === 'I' ? 'InventoryItem' : 'Recipe';

          this.addError({
            errorMessage: 'Duplicate ingredients',
            errorType: 'DUPLICATE',
            contextEntity: 'CreateRecipeDto',
            sourceEntity: entity,
            sourceId: ingredId,
          } as ValidationError);
        }
      }
    }

    this.throwIfErrors();
  }

  public async validateUpdate(id: number, dto: UpdateRecipeDto): Promise<void> {
    // Exists
    if (dto.recipeName) {
      if (await this.helper.exists(this.repo, 'recipeName', dto.recipeName)) {
        this.addError({
          errorMessage: 'Recipe already exists.',
          errorType: 'EXIST',
          contextEntity: 'UpdateRecipeDto',
          contextId: id,
          sourceEntity: 'Recipe',
          value: dto.recipeName,
        } as ValidationError);
      }
    }

    // Validate category / subcategory
    if (dto.categoryId && dto.subCategoryId) {
      const category = await this.categoryService.findOne(dto.categoryId, [
        'subCategories',
      ]);
      if (!category.subCategories) {
        throw new Error('subcategories is null');
      }

      // category / subcategory
      if (!category.subCategories.find((cat) => cat.id === dto.subCategoryId)) {
        this.addError({
          errorMessage: 'Invalid category / subcategory',
          errorType: 'INVALID',
          contextEntity: 'UpdateRecipeDto',
          contextId: id,
          sourceEntity: 'RecipeSubCategory',
          sourceId: dto.subCategoryId,
          conflictEntity: 'RecipeCategory',
          conflictId: dto.categoryId,
        } as ValidationError);
      }
    } else if (!dto.categoryId && dto.subCategoryId) {
      const currentCategory = (
        await this.recipeService.findOne(
          id,
          ['category'],
          ['category.subCategories'],
        )
      ).category;

      // null category / subcategory
      if (!currentCategory) {
        this.addError({
          errorMessage:
            'Cannot assign a subcategory without an assigned category',
          errorType: 'INVALID',
          contextEntity: 'UpdateRecipeDto',
          contextId: id,
          sourceEntity: 'RecipeSubCategory',
          sourceId: dto.subCategoryId,
        } as ValidationError);
      }
      // category / subcategory
      else if (
        !currentCategory.subCategories.find(
          (cat) => cat.id === dto.subCategoryId,
        )
      ) {
        this.addError({
          errorMessage: 'Invalid category / subcategory',
          errorType: 'INVALID',
          contextEntity: 'UpdateRecipeDto',
          contextId: id,
          sourceEntity: 'RecipeSubCategory',
          sourceId: dto.subCategoryId,
          conflictEntity: 'RecipeCategory',
          conflictId: currentCategory.id,
        } as ValidationError);
      }
    }

    if (dto.ingredientDtos) {
      // resolve
      const resolvedDtos: string[] = [];
      const resolvedIds: number[] = [];
      for (const nested of dto.ingredientDtos) {
        if (nested.createDto) {
          if (nested.createDto.ingredientInventoryItemId) {
            resolvedDtos.push(
              `I:${nested.createDto.ingredientInventoryItemId}`,
            );
          }
          if (nested.createDto.ingredientRecipeId) {
            resolvedDtos.push(`R:${nested.createDto.ingredientRecipeId}`);
          }
        } else if (nested.updateDto && nested.id) {
          if (nested.updateDto.ingredientInventoryItemId) {
            resolvedDtos.push(
              `I:${nested.updateDto.ingredientInventoryItemId}`,
            );
          }
          if (nested.updateDto.ingredientRecipeId) {
            resolvedDtos.push(`R:${nested.updateDto.ingredientRecipeId}`);
          }
          resolvedIds.push(nested.id);
        } else {
          throw new Error();
        }
      }

      // No duplicate recipeIngredients
      const duplicateIngreds = this.helper.findDuplicates(
        resolvedDtos,
        (ingred) => `${ingred}`,
      );
      if (duplicateIngreds) {
        for (const dup of duplicateIngreds) {
          const [prefix, idStr] = dup.split(':');
          const ingredId = parseInt(idStr, 10);
          const entity = prefix === 'I' ? 'InventoryItem' : 'Recipe';

          this.addError({
            errorMessage: 'Duplicate ingredients',
            errorType: 'DUPLICATE',
            contextEntity: 'UpdateRecipeDto',
            contextId: id,
            sourceEntity: entity,
            sourceId: ingredId,
          } as ValidationError);
        }
      }

      // No duplicate ingredient updates
      const duplicateIds = this.helper.findDuplicates(
        resolvedIds,
        (id) => `${id}`,
      );
      if (duplicateIds) {
        for (const dupId of duplicateIds) {
          this.addError({
            errorMessage: 'Multiple update requests for the same ingredient',
            errorType: 'DUPLICATE',
            contextEntity: 'UpdateRecipeDto',
            contextId: id,
            sourceEntity: 'RecipeIngredient',
            sourceId: dupId,
          } as ValidationError);
        }
      }
    }

    this.throwIfErrors();
  }
}
