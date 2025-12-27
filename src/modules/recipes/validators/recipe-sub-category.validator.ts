import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorNode } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateRecipeSubCategoryDto } from '../dto/recipe-sub-category/create-recipe-sub-category.dto';
import { UpdateRecipeSubCategoryDto } from '../dto/recipe-sub-category/update-recipe-sub-category.dto';
import {
  RecipeSubCategory,
  RecipeSubCategoryEntity,
} from '../entities/recipe-sub-category.entity';

@Injectable()
export class RecipeSubCategoryValidator extends ValidatorBase<RecipeSubCategoryEntity> {
  constructor(
    @InjectRepository(RecipeSubCategory)
    private readonly repo: Repository<RecipeSubCategory>,

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

    /**
     * Currently checks for duplicates accross all categories,
     * not just duplicates within its respective category
     */
    if (await this.helper.exists(this.repo, 'subCategoryName', dto.name)) {
      const err = new ValidationErrorNode(
        'subCategoryName',
        id,
        'Recipe subcategory already exists.',
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

    /**
     * Currently checks for duplicates accross all categories,
     * not just duplicates within its respective category
     */
    if (dto.name) {
      if (await this.helper.exists(this.repo, 'subCategoryName', dto.name)) {
        const err = new ValidationErrorNode(
          'subCategoryName',
          id,
          'Recipe subcategory already exists.',
        );
        results.push(err);
      }
    }

    return this.checkValidateResult(results);
  }
}
