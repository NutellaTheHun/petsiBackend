import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorNode } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateRecipeSubCategoryDto } from '../dto/recipe-sub-category/create-recipe-sub-category.dto';
import { UpdateRecipeSubCategoryDto } from '../dto/recipe-sub-category/update-recipe-sub-category.dto';
import { RecipeCategory } from '../entities/recipe-category.entity';
import {
  RecipeSubCategory,
  RecipeSubCategoryEntity,
} from '../entities/recipe-sub-category.entity';

@Injectable()
export class RecipeSubCategoryValidator extends ValidatorBase<RecipeSubCategoryEntity> {
  constructor(
    @InjectRepository(RecipeSubCategory)
    private readonly repo: Repository<RecipeSubCategory>,

    @InjectRepository(RecipeCategory)
    private readonly recipeCategoryRepo: Repository<RecipeCategory>,

    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'RecipeSubCategory', requestContextService, logger);
  }

  protected async doValidateCreateNode(
    dto: CreateRecipeSubCategoryDto,
    id?: string,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // validate name is not equal to parent category name
    const parentCategory = await this.recipeCategoryRepo.findOne({
      where: { id: dto.parentCategoryId },
    });
    if (!parentCategory) {
      throw new Error(
        `recipe sub category create: parent category with id ${dto.parentCategoryId} was not found`,
      );
    }

    if (dto.name === parentCategory.name) {
      const err = new ValidationErrorNode(
        'name',
        id,
        'Recipe subcategory name cannot be the same as the parent category name',
      );
      results.push(err);
    }
    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateRecipeSubCategoryDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    if (dto.name) {
      const entity = await this.repo.findOne({
        where: { id },
        relations: ['parentCategory'],
      });
      if (!entity) {
        throw new Error(
          `recipe sub category update: sub category being updated with id ${id} was not found`,
        );
      }

      // Validate name is unique within its category
      await this.helper.enforceUniqueInArr(
        dto.name,
        entity.parentCategory.subCategories.map((cat) => cat.name),
        'name',
        results,
        'Recipe subcategory already exists.',
        id,
      );

      // Validate name is not equal to parent category name
      if (dto.name === entity.parentCategory.name) {
        const err = new ValidationErrorNode(
          'name',
          id,
          'Recipe subcategory name cannot be the same as the parent category name',
        );
        results.push(err);
      }
    }

    return this.checkValidateResult(results);
  }
}
