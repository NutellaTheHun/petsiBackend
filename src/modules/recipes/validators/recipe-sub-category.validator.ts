import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationError } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateRecipeSubCategoryDto } from '../dto/recipe-sub-category/create-recipe-sub-category.dto';
import { UpdateRecipeSubCategoryDto } from '../dto/recipe-sub-category/update-recipe-sub-category.dto';
import { RecipeSubCategory } from '../entities/recipe-sub-category.entity';

@Injectable()
export class RecipeSubCategoryValidator extends ValidatorBase<RecipeSubCategory> {
  constructor(
    @InjectRepository(RecipeSubCategory)
    private readonly repo: Repository<RecipeSubCategory>,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'RecipeSubCategory', requestContextService, logger);
  }

  public async validateCreate(dto: CreateRecipeSubCategoryDto): Promise<void> {
    if (
      await this.helper.exists(
        this.repo,
        'subCategoryName',
        dto.subCategoryName,
      )
    ) {
      this.addError({
        errorMessage:
          'Recipe subcategory already exists. (name is in use accross all subcategories)',
        errorType: 'EXIST',
        contextEntity: 'CreateRecipeSubCategoryDto',
        sourceEntity: 'RecipeSubCategory',
        value: dto.subCategoryName,
      } as ValidationError);
    }

    this.throwIfErrors();
  }

  public async validateUpdate(
    id: number,
    dto: UpdateRecipeSubCategoryDto,
  ): Promise<void> {
    if (dto.subCategoryName) {
      if (
        await this.helper.exists(
          this.repo,
          'subCategoryName',
          dto.subCategoryName,
        )
      ) {
        this.addError({
          errorMessage:
            'Recipe subcategory already exists. (name is in use accross all subcategories)',
          errorType: 'EXIST',
          contextEntity: 'CreateRecipeSubCategoryDto',
          contextId: id,
          sourceEntity: 'RecipeSubCategory',
          value: dto.subCategoryName,
        } as ValidationError);
      }
    }

    this.throwIfErrors();
  }
}
