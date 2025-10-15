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

    logger: AppLogger,
    requestContextService: RequestContextService,
    private readonly subCategoryValidator: RecipeSubCategoryValidator,
  ) {
    super(repo, 'RecipeCategory', requestContextService, logger);
  }

  protected async doValidateCreateNode(
    dto: CreateRecipeCategoryDto,
    id?: string,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // Exists
    if (await this.helper.exists(this.repo, 'categoryName', dto.categoryName)) {
      const err = new ValidationErrorNode(
        'categoryName',
        undefined,
        'Recipe category already exists.',
      );
      results.push(err);
    }

    if (dto.subCategoryDtos && dto.subCategoryDtos.length > 0) {
      const nestedDtoErrs =
        await this.subCategoryValidator.validateManyNestedNode(
          'subCategories',
          dto.subCategoryDtos,
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

    if (dto.categoryName) {
      // Exists
      if (
        await this.helper.exists(this.repo, 'categoryName', dto.categoryName)
      ) {
        const err = new ValidationErrorNode(
          'categoryName',
          undefined,
          'Recipe category already exists.',
        );
        results.push(err);
      }
    }

    if (dto.subCategoryDtos && dto.subCategoryDtos.length > 0) {
      const nestedDtoErrs =
        await this.subCategoryValidator.validateManyNestedNode(
          'subCategories',
          dto.subCategoryDtos,
        );
      if (nestedDtoErrs) {
        results.push(nestedDtoErrs);
      }
    }

    return this.checkValidateResult(results);
  }
}
