import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BuilderBase } from '../../../common/base/builder.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateRecipeCategoryDto } from '../dto/recipe-category/create-recipe-category.dto';
import { UpdateRecipeCategoryDto } from '../dto/recipe-category/update-recipe-category.dto';
import { CreateRecipeSubCategoryDto } from '../dto/recipe-sub-category/create-recipe-sub-category.dto';
import { NestedCreateRecipeSubCategoryDto } from '../dto/recipe-sub-category/nested-create-recipe-sub-category.dto';
import { NestedUpdateRecipeSubCategoryDto } from '../dto/recipe-sub-category/nested-update-recipe-sub-category.dto';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { Recipe } from '../entities/recipe.entity';
import { RecipeSubCategoryBuilder } from './recipe-sub-category.builder';

@Injectable()
export class RecipeCategoryBuilder extends BuilderBase<RecipeCategory> {
  constructor(
    @InjectRepository(Recipe)
    private readonly recipeRepo: Repository<Recipe>,

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
    if (dto.subCategories !== undefined) {
      this.subCategoriesByBuilder(dto.subCategories);
    }
  }

  public name(name: string): this {
    return this.setPropByVal('name', name);
  }

  public subCategoriesByBuilder(
    dtos: (
      | CreateRecipeSubCategoryDto
      | NestedCreateRecipeSubCategoryDto
      | NestedUpdateRecipeSubCategoryDto
    )[],
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
      async (ids: number[]) =>
        await this.recipeRepo.find({ where: { id: In(ids) } }),
      'recipes',
      ids,
    );
  }
}
