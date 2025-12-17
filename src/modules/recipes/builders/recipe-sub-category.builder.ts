import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { BuilderBase } from '../../../base/builder-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateRecipeSubCategoryDto } from '../dto/recipe-sub-category/create-recipe-sub-category.dto';
import { NestedRecipeSubCategoryDto } from '../dto/recipe-sub-category/nested-recipe-sub-category.dto';
import { UpdateRecipeSubCategoryDto } from '../dto/recipe-sub-category/update-recipe-sub-category.dto';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { RecipeSubCategory } from '../entities/recipe-sub-category.entity';
import { RecipeCategoryService } from '../services/recipe-category.service';
import { RecipeSubCategoryService } from '../services/recipe-sub-category.service';
import { RecipeService } from '../services/recipe.service';

@Injectable()
export class RecipeSubCategoryBuilder extends BuilderBase<RecipeSubCategory> {
  constructor(
    @Inject(forwardRef(() => RecipeCategoryService))
    private readonly categoryService: RecipeCategoryService,

    @Inject(forwardRef(() => RecipeSubCategoryService))
    private readonly subCategoryService: RecipeSubCategoryService,

    @Inject(forwardRef(() => RecipeService))
    private readonly recipeService: RecipeService,

    requestContextService: RequestContextService,
    logger: AppLogger,
  ) {
    super(
      RecipeSubCategory,
      'RecipeSubCategoryBuilder',
      requestContextService,
      logger,
    );
  }

  protected createEntity(dto: CreateRecipeSubCategoryDto): void {
    if (dto.name !== undefined) {
      this.name(dto.name);
    }
    if (dto.parentCategoryId !== undefined) {
      this.parentCategoryById(dto.parentCategoryId);
    }
  }

  protected updateEntity(dto: UpdateRecipeSubCategoryDto): void {
    if (dto.name !== undefined) {
      this.name(dto.name);
    }
  }

  public async buildMany(
    parent: RecipeCategory,
    dtos: (CreateRecipeSubCategoryDto | NestedRecipeSubCategoryDto)[],
  ): Promise<RecipeSubCategory[]> {
    const results: RecipeSubCategory[] = [];
    for (const dto of dtos) {
      if (dto instanceof CreateRecipeSubCategoryDto) {
        results.push(await this.buildCreateDto(dto));
      } else {
        if (dto.createId && dto.createDto) {
          results.push(await this.buildCreateDto(dto.createDto, parent));
        }
        if (dto.id && dto.updateDto) {
          const subCat = await this.subCategoryService.findOne(dto.id);
          if (!subCat) {
            throw new Error('recipe ingredient not found');
          }
          results.push(await this.buildUpdateDto(subCat, dto.updateDto));
        }
      }
    }
    return results;
  }

  public name(name: string): this {
    return this.setPropByVal('subCategoryName', name);
  }

  public parentCategoryById(id: number): this {
    return this.setPropById(
      this.categoryService.findOne.bind(this.categoryService),
      'parentCategory',
      id,
    );
  }

  public parentCategoryByName(name: string): this {
    return this.setPropByName(
      this.categoryService.findOneByName.bind(this.categoryService),
      'parentCategory',
      name,
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
