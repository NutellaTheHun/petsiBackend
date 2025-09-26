import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { RecipeCategoryBuilder } from '../builders/recipe-category.builder';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { RecipeCategoryValidator } from '../validators/recipe-category.validator';

@Injectable()
export class RecipeCategoryService extends ServiceBase<RecipeCategory> {
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

  async findOneByName(
    name: string,
    relations?: Array<keyof RecipeCategory>,
  ): Promise<RecipeCategory | null> {
    return await this.repo.findOne({
      where: { categoryName: name },
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
