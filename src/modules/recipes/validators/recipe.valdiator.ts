import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateRecipeDto } from '../dto/recipe/create-recipe.dto';
import { UpdateRecipeDto } from '../dto/recipe/update-recipe-dto';
import { Recipe, RecipeEntity } from '../entities/recipe.entity';
import { RecipeCategoryService } from '../services/recipe-category.service';
import { RecipeService } from '../services/recipe.service';

@Injectable()
export class RecipeValidator extends ValidatorBase<RecipeEntity> {
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

  protected async doValidateCreateNode(
    dto: CreateRecipeDto,
    id?: string,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // Exists
    if (await this.helper.exists(this.repo, 'recipeName', dto.recipeName)) {
      const err = new ValidationErrorNode(
        'recipeName',
        undefined,
        'Recipe with this name already exists.',
      );
      results.push(err);
    }

    // Validate category / subcategory
    if (dto.categoryId && dto.subCategoryId) {
      const category = await this.categoryService.findOne(dto.categoryId, [
        'subCategories',
      ]);
      if (!category.subCategories) {
        throw new Error('subcategories is null');
      }

      if (!category.subCategories.find((cat) => cat.id === dto.subCategoryId)) {
        const err = new ValidationErrorNode(
          'subCategory',
          undefined,
          'Invalid category / subcategory combination',
        );
        results.push(err);
      }
    }

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateRecipeDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    if (dto.recipeName) {
      if (await this.helper.exists(this.repo, 'recipeName', dto.recipeName)) {
        const err = new ValidationErrorNode(
          'recipeName',
          undefined,
          'Recipe with this name already exists.',
        );
        results.push(err);
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

      if (!category.subCategories.find((cat) => cat.id === dto.subCategoryId)) {
        const err = new ValidationErrorNode(
          'subCategory',
          undefined,
          'Invalid category / subcategory combination',
        );
        results.push(err);
      }
    }

    return this.checkValidateResult(results);
  }
}
