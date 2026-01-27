import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BuilderBase } from '../../../common/base/builder.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateRecipeSubCategoryDto } from '../dto/recipe-sub-category/create-recipe-sub-category.dto';
import { NestedCreateRecipeSubCategoryDto } from '../dto/recipe-sub-category/nested-create-recipe-sub-category.dto';
import { NestedUpdateRecipeSubCategoryDto } from '../dto/recipe-sub-category/nested-update-recipe-sub-category.dto';
import { UpdateRecipeSubCategoryDto } from '../dto/recipe-sub-category/update-recipe-sub-category.dto';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { RecipeSubCategory } from '../entities/recipe-sub-category.entity';
import { Recipe } from '../entities/recipe.entity';

@Injectable()
export class RecipeSubCategoryBuilder extends BuilderBase<RecipeSubCategory> {
  constructor(
    @InjectRepository(RecipeCategory)
    private readonly categoryRepo: Repository<RecipeCategory>,

    @InjectRepository(RecipeSubCategory)
    private readonly subCategoryRepo: Repository<RecipeSubCategory>,

    @InjectRepository(Recipe)
    private readonly recipeRepo: Repository<Recipe>,

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
    dtos: (
      | CreateRecipeSubCategoryDto
      | NestedCreateRecipeSubCategoryDto
      | NestedUpdateRecipeSubCategoryDto
    )[],
  ): Promise<RecipeSubCategory[]> {
    const results: RecipeSubCategory[] = [];
    for (const dto of dtos) {
      if (dto instanceof CreateRecipeSubCategoryDto) {
        results.push(await this.buildCreateDto(dto));
      } else {
        if ('createId' in dto) {
          results.push(await this.buildCreateDto(dto, parent, dto.createId));
        }
        if ('id' in dto) {
          const subCat = await this.subCategoryRepo.findOne({
            where: { id: dto.id },
          });
          if (!subCat) {
            throw new Error('recipe ingredient not found');
          }
          results.push(await this.buildUpdateDto(subCat, dto));
        }
      }
    }
    return results;
  }

  public name(name: string): this {
    return this.setPropByVal('name', name);
  }

  public parentCategoryById(id: number): this {
    return this.setPropById(
      async (id: number) => await this.categoryRepo.findOne({ where: { id } }),
      'parentCategory',
      id,
    );
  }

  public parentCategoryByName(name: string): this {
    return this.setPropByName(
      async (name: string) =>
        await this.categoryRepo.findOne({ where: { name } }),
      'parentCategory',
      name,
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
