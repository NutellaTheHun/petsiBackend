import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
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
  ): Promise<ValidationErrorMap> {
    const errorMap = new ValidationErrorMap(id);

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
      errorMap.addChild(
        'name',
        new ValidationErrorMap(
          undefined,
          'Recipe subcategory name cannot be the same as the parent category name',
        ),
      );
    }
    return errorMap;
  }

  protected async doValidateUpdateNode(
    dto: UpdateRecipeSubCategoryDto,
    id: number,
  ): Promise<ValidationErrorMap> {
    const errorMap = new ValidationErrorMap(id);

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
      await this.helper.enforceNotInList(
        dto.name,
        entity.parentCategory.subCategories.map((cat) => cat.name),
        'name',
        errorMap,
        'Recipe subcategory already exists.',
      );

      // Validate name is not equal to parent category name
      if (dto.name === entity.parentCategory.name) {
        errorMap.addChild(
          'name',
          new ValidationErrorMap(
            undefined,
            'Recipe subcategory name cannot be the same as the parent category name',
          ),
        );
      }
    }

    return errorMap;
  }
}
