import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../common/base/service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateRecipeSubCategoryDto } from '../dto/recipe-sub-category/create-recipe-sub-category.dto';
import { UpdateRecipeSubCategoryDto } from '../dto/recipe-sub-category/update-recipe-sub-category.dto';
import {
  RecipeSubCategory,
  RecipeSubCategoryEntity,
} from '../entities/recipe-sub-category.entity';
import { RecipeSubCategoryComposer } from '../utils/composers/recipe-sub-category.composer';
import { RecipeSubCategoryValidator } from '../validators/recipe-sub-category.validator';

@Injectable()
export class RecipeSubCategoryService extends ServiceBase<RecipeSubCategoryEntity> {
  constructor(
    @InjectRepository(RecipeSubCategory)
    repo: Repository<RecipeSubCategory>,
    requestContextService: RequestContextService,
    logger: AppLogger,
    validator: RecipeSubCategoryValidator,

    private readonly subCategoryComposer: RecipeSubCategoryComposer,
  ) {
    super(
      repo,
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
    return await this.subCategoryComposer.composeCreate(dto, manager);
  }

  protected async updateEntity(
    dto: UpdateRecipeSubCategoryDto,
    manager: EntityManager,
    entity: RecipeSubCategory,
  ): Promise<void> {
    await this.subCategoryComposer.composeUpdate(dto, manager, entity);
  }

  protected applySortBy(
    query: SelectQueryBuilder<RecipeSubCategory>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    if (sortBy === 'name') {
      query.orderBy(`entity.${sortBy}`, sortOrder);
    }
  }
}
