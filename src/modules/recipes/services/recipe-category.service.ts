import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../common/base/service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { RecipeCategoryBuilder } from '../builders/recipe-category.builder';
import { CreateRecipeCategoryDto } from '../dto/recipe-category/create-recipe-category.dto';
import { UpdateRecipeCategoryDto } from '../dto/recipe-category/update-recipe-category.dto';
import {
  RecipeCategory,
  RecipeCategoryEntity,
} from '../entities/recipe-category.entity';
import { RecipeSubCategory } from '../entities/recipe-sub-category.entity';
import { RecipeSubCategoryCreateInTransaction } from '../utils/transactions/recipe-sub-category.create.transaction';
import { RecipeSubCategoryUpdateInTransaction } from '../utils/transactions/recipe-sub-category.update.transaction';
import { RecipeCategoryValidator } from '../validators/recipe-category.validator';

@Injectable()
export class RecipeCategoryService extends ServiceBase<RecipeCategoryEntity> {
  constructor(
    @InjectRepository(RecipeCategory)
    private readonly repo: Repository<RecipeCategory>,

    @Inject(forwardRef(() => RecipeCategoryBuilder))
    builder: RecipeCategoryBuilder,

    requestContextService: RequestContextService,
    logger: AppLogger,
    validator: RecipeCategoryValidator,
  ) {
    super(
      repo,
      builder,
      'RecipeCategoryService',
      requestContextService,
      logger,
      validator,
    );
  }

  protected async createEntity(
    dto: CreateRecipeCategoryDto,
    manager: EntityManager,
  ): Promise<RecipeCategory> {
    let subCategories: RecipeSubCategory[] = [];
    if (dto.subCategories) {
      for (const nestedDto of dto.subCategories) {
        if (nestedDto.createDto) {
          const newSubCat = await RecipeSubCategoryCreateInTransaction(
            nestedDto.createDto,
            manager,
          );
          subCategories.push(newSubCat);
        } else {
          throw new Error(
            'Create Recipe Category: nested sub category create dto is missing',
          );
        }
      }
    }
    const result = manager.create(RecipeCategory, {
      categoryName: dto.name,
      subCategories,
    });
    return result;
  }

  protected async updateEntity(
    dto: UpdateRecipeCategoryDto,
    manager: EntityManager,
    entity: RecipeCategory,
  ): Promise<void> {
    if (dto.name !== undefined) {
      entity.name = dto.name;
    }

    if (dto.subCategories) {
      const existingSubCats = await manager.find(RecipeSubCategory, {
        where: { parentCategory: { id: entity.id } },
      });
      const existingMap = new Map(existingSubCats.map((i) => [i.id, i]));

      for (const nestedDto of dto.subCategories) {
        if (nestedDto.createDto) {
          const newSubCat = await RecipeSubCategoryCreateInTransaction(
            nestedDto.createDto,
            manager,
          );
          existingMap.set(newSubCat.id, newSubCat);
        } else if (nestedDto.updateDto && nestedDto.id) {
          const toUpdate = existingMap.get(nestedDto.id);
          if (!toUpdate) {
            throw new Error(
              `Update RecipeCategory: nested subCat dto to update with id ${nestedDto.id} was not found in existing subCategories`,
            );
          }
          await RecipeSubCategoryUpdateInTransaction(
            nestedDto.updateDto,
            manager,
            toUpdate,
          );
        } else {
          throw new Error(
            'Update Recipe Category: Nested SubCategory DTO has neither create dto or update dto with id',
          );
        }
      }

      entity.subCategories = Array.from(existingMap.values());
    }
  }

  async findOneByName(
    name: string,
    relations?: Array<keyof RecipeCategory>,
  ): Promise<RecipeCategory | null> {
    return await this.repo.findOne({
      where: { name: name },
      relations,
    });
  }

  protected applySortBy(
    query: SelectQueryBuilder<RecipeCategory>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    if (sortBy === 'categoryName') {
      query.orderBy(`entity.${sortBy}`, sortOrder);
    }
  }
}
