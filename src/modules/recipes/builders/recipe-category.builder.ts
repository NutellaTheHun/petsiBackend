import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { BuilderBase } from '../../../common/base/builder.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateRecipeCategoryDto } from '../dto/recipe-category/create-recipe-category.dto';
import { UpdateRecipeCategoryDto } from '../dto/recipe-category/update-recipe-category.dto';
import { CreateRecipeSubCategoryDto } from '../dto/recipe-sub-category/create-recipe-sub-category.dto';
import { NestedRecipeSubCategoryDto } from '../dto/recipe-sub-category/nested-recipe-sub-category.dto';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { RecipeSubCategoryService } from '../services/recipe-sub-category.service';
import { RecipeService } from '../services/recipe.service';
import { RecipeSubCategoryBuilder } from './recipe-sub-category.builder';

@Injectable()
export class RecipeCategoryBuilder extends BuilderBase<RecipeCategory> {
  constructor(
    @Inject(forwardRef(() => RecipeSubCategoryService))
    private readonly recipeService: RecipeService,

    @Inject(forwardRef(() => RecipeSubCategoryBuilder))
    private readonly subCategoryBuilder: RecipeSubCategoryBuilder,

    requestContextService: RequestContextService,
    logger: AppLogger,
  ) {
    super(
      RecipeCategory,
      'RecipeCategoryBuilder',
      requestContextService,
      logger,
    );
  }

  protected createEntity(dto: CreateRecipeCategoryDto): void {
    if (dto.name !== undefined) {
      this.name(dto.name);
    }
    if (dto.subCategories !== undefined) {
      this.subCategoriesByBuilder(dto.subCategories);
    }
  }

  protected updateEntity(dto: UpdateRecipeCategoryDto): void {
    if (dto.name !== undefined) {
      this.name(dto.name);
    }
    /*if (dto.subCategoryDtos !== undefined) {
      this.subCategoriesByBuilder(dto.subCategoryDtos);
    }*/
  }

  public name(name: string): this {
    return this.setPropByVal('categoryName', name);
  }

  public subCategoriesByBuilder(
    dtos: (CreateRecipeSubCategoryDto | NestedRecipeSubCategoryDto)[],
  ): this {
    return this.setPropByBuilder(
      this.subCategoryBuilder.buildMany.bind(this.subCategoryBuilder),
      'subCategories',
      this.entity,
      dtos,
    );
  }

  public recipesById(ids: number[]): this {
    return this.setPropsByIds(
      this.recipeService.findEntitiesById.bind(this.recipeService),
      'recipes',
      ids,
    );
  }
}
