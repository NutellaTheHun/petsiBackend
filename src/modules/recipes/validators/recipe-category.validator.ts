import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
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
    if (await this.helper.exists(this.repo, 'categoryName', dto.name)) {
      const err = new ValidationErrorNode(
        'categoryName',
        id,
        'Recipe category already exists.',
      );
      results.push(err);
    }

    // nested validator call
    if (dto.subCategories && dto.subCategories.length) {
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
      if (await this.helper.exists(this.repo, 'categoryName', dto.name)) {
        const err = new ValidationErrorNode(
          'categoryName',
          id,
          'Recipe category already exists.',
        );
        results.push(err);
      }
    }

    // nested validator call
    if (dto.subCategories && dto.subCategories.length) {
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
