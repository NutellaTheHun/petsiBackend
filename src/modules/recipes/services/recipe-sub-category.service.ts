import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../common/base/service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { RecipeSubCategoryBuilder } from '../builders/recipe-sub-category.builder';
import { CreateRecipeSubCategoryDto } from '../dto/recipe-sub-category/create-recipe-sub-category.dto';
import { UpdateRecipeSubCategoryDto } from '../dto/recipe-sub-category/update-recipe-sub-category.dto';
import {
  RecipeSubCategory,
  RecipeSubCategoryEntity,
} from '../entities/recipe-sub-category.entity';
import { RecipeSubCategoryCreateInTransaction } from '../utils/transactions/recipe-sub-category.create.transaction';
import { RecipeSubCategoryUpdateInTransaction } from '../utils/transactions/recipe-sub-category.update.transaction';
import { RecipeSubCategoryValidator } from '../validators/recipe-sub-category.validator';

@Injectable()
export class RecipeSubCategoryService extends ServiceBase<RecipeSubCategoryEntity> {
  constructor(
    @InjectRepository(RecipeSubCategory)
    private readonly repo: Repository<RecipeSubCategory>,

    @Inject(forwardRef(() => RecipeSubCategoryBuilder))
    builder: RecipeSubCategoryBuilder,

    requestContextService: RequestContextService,
    logger: AppLogger,
    validator: RecipeSubCategoryValidator,
  ) {
    super(
      repo,
      builder,
      'RecipeSubCategoryService',
      requestContextService,
      logger,
      validator,
    );
  }

  protected async createEntity(
    dto: CreateRecipeSubCategoryDto,
    manager: EntityManager,
  ): Promise<RecipeSubCategory> {
    return await RecipeSubCategoryCreateInTransaction(dto, manager);
  }

  protected async updateEntity(
    dto: UpdateRecipeSubCategoryDto,
    manager: EntityManager,
    entity: RecipeSubCategory,
  ): Promise<void> {
    await RecipeSubCategoryUpdateInTransaction(dto, manager, entity);
  }

  async findOneByName(
    name: string,
    relations?: Array<keyof RecipeSubCategory>,
  ): Promise<RecipeSubCategory | null> {
    return this.repo.findOne({ where: { name: name }, relations });
  }

  protected applySortBy(
    query: SelectQueryBuilder<RecipeSubCategory>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    if (sortBy === 'subCategoryName') {
      query.orderBy(`entity.${sortBy}`, sortOrder);
    }
  }
}
