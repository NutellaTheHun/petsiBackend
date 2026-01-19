import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorNode } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateRecipeCategoryDto } from '../dto/recipe-category/create-recipe-category.dto';
import { UpdateRecipeCategoryDto } from '../dto/recipe-category/update-recipe-category.dto';
import {
  RecipeCategory,
  RecipeCategoryEntity,
} from '../entities/recipe-category.entity';
import { RecipeSubCategoryValidator } from './recipe-sub-category.validator';

@Injectable()
export class RecipeCategoryValidator extends ValidatorBase<RecipeCategoryEntity> {
  constructor(
    @InjectRepository(RecipeCategory)
    private readonly repo: Repository<RecipeCategory>,

    private readonly subCategoryValidator: RecipeSubCategoryValidator,

    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'RecipeCategory', requestContextService, logger);
  }

  protected async doValidateCreateNode(
    dto: CreateRecipeCategoryDto,
    id?: string,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // Exists
    await this.helper.enforceUnique(
      dto.name,
      this.repo,
      'name',
      results,
      'Recipe category already exists.',
      id,
    );

    if (dto.subCategories?.length) {
      // No duplicate sub categories
      await this.helper.enforceNoDuplicateElements(
        dto.subCategories,
        (item) => `${item.name}`,
        'subCategories',
        results,
        'duplicate sub category',
        id,
      );

      // nested validator call
      const nestedDtoErrs =
        await this.subCategoryValidator.validateManyNestedNode(
          'subCategories',
          dto.subCategories,
        );
      if (nestedDtoErrs) {
        results.push(nestedDtoErrs);
      }
    }

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateRecipeCategoryDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    if (dto.name) {
      // Exists
      await this.helper.enforceUnique(
        dto.name,
        this.repo,
        'name',
        results,
        'Recipe category already exists.',
        id,
      );
    }

    if (dto.subCategories?.length) {
      // No duplicate sub categories
      await this.helper.enforceNoDuplicateElements(
        dto.subCategories,
        (item) => `${item.name}`,
        'subCategories',
        results,
        'duplicate sub category',
        id,
      );

      // nested validator call
      const nestedDtoErrs =
        await this.subCategoryValidator.validateManyNestedNode(
          'subCategories',
          dto.subCategories,
        );
      if (nestedDtoErrs) {
        results.push(nestedDtoErrs);
      }
    }

    return this.checkValidateResult(results);
  }
}
