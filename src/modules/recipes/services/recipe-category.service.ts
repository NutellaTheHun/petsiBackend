import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceBase } from '../../../common/base/service.base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateRecipeCategoryDto } from '../dto/recipe-category/create-recipe-category.dto';
import { UpdateRecipeCategoryDto } from '../dto/recipe-category/update-recipe-category.dto';
import {
  RecipeCategory,
  RecipeCategoryEntity,
} from '../entities/recipe-category.entity';
import { RecipeSubCategory } from '../entities/recipe-sub-category.entity';
import { RecipeSubCategoryComposer } from '../utils/composers/recipe-sub-category.composer';
import { RecipeCategoryValidator } from '../validators/recipe-category.validator';

@Injectable()
export class RecipeCategoryService extends ServiceBase<RecipeCategoryEntity> {
  constructor(
    @InjectRepository(RecipeCategory)
    private readonly repo: Repository<RecipeCategory>,

    //@Inject(forwardRef(() => RecipeCategoryBuilder))
    //builder: RecipeCategoryBuilder,

    requestContextService: RequestContextService,
    logger: AppLogger,
    validator: RecipeCategoryValidator,
    private readonly subCategoryComposer: RecipeSubCategoryComposer,
  ) {
    super(
      repo,
      //builder,
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
    const result = manager.create(RecipeCategory, {
      name: dto.name,
    });

    const savedEntity = await manager.save(result);

    if (dto.subCategories?.length) {
      savedEntity.subCategories =
        await this.subCategoryComposer.composeManyNestedEntity(
          dto.subCategories,
          manager,
          [],
          {
            parentCategoryId: savedEntity.id,
          },
        );

      await manager.save(savedEntity);
    }

    return savedEntity;
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

      entity.subCategories =
        await this.subCategoryComposer.composeManyNestedEntity(
          dto.subCategories,
          manager,
          existingSubCats,
          {
            parentCategoryId: entity.id,
          },
        );
    }

    await manager.save(entity);
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
    if (sortBy === 'name') {
      query.orderBy(`entity.${sortBy}`, sortOrder);
    }
  }
}
