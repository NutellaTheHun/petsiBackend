import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationError } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateRecipeCategoryDto } from '../dto/recipe-category/create-recipe-category.dto';
import { UpdateRecipeCategoryDto } from '../dto/recipe-category/update-recipe-category.dto';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { RecipeSubCategoryService } from '../services/recipe-sub-category.service';

@Injectable()
export class RecipeCategoryValidator extends ValidatorBase<RecipeCategory> {
  constructor(
    @InjectRepository(RecipeCategory)
    private readonly repo: Repository<RecipeCategory>,

    @Inject(forwardRef(() => RecipeSubCategoryService))
    private readonly subCategoryService: RecipeSubCategoryService,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'RecipeCategory', requestContextService, logger);
  }

  public async validateCreate(dto: CreateRecipeCategoryDto): Promise<void> {
    // Exists
    if (await this.helper.exists(this.repo, 'categoryName', dto.categoryName)) {
      this.addError({
        errorMessage: 'Recipe category already exists.',
        errorType: 'EXIST',
        contextEntity: 'CreateRecipeCategoryDto',
        sourceEntity: 'RecipeCategory',
        value: dto.categoryName,
      } as ValidationError);
    }

    // Check for subcategories with duplicate names
    if (dto.subCategoryDtos) {
      const duplicateSubCats = this.helper.findDuplicates(
        dto.subCategoryDtos,
        (item) => `${item.subCategoryName}`,
      );
      if (duplicateSubCats) {
        for (const dup of duplicateSubCats) {
          this.addError({
            errorMessage: 'Duplicate sub category.',
            errorType: 'DUPLICATE',
            contextEntity: 'CreateRecipeCategoryDto',
            sourceEntity: 'RecipeSubCategory',
            value: dup.subCategoryName,
          } as ValidationError);
        }
      }
    }

    this.throwIfErrors();
  }

  public async validateUpdate(
    id: number,
    dto: UpdateRecipeCategoryDto,
  ): Promise<void> {
    // Exists
    if (dto.categoryName) {
      if (
        await this.helper.exists(this.repo, 'categoryName', dto.categoryName)
      ) {
        this.addError({
          errorMessage: 'Recipe category already exists.',
          errorType: 'EXIST',
          contextEntity: 'UpdateRecipeCategoryDto',
          contextId: id,
          sourceEntity: 'RecipeCategory',
          value: dto.categoryName,
        } as ValidationError);
      }
    }

    /*if (dto.subCategoryDtos) {
            // resolve
            const resolvedNames: string[] = [];
            const resolvedIds: number[] = [];
            for (const d of dto.subCategoryDtos) {
                if (d.mode === 'create') {
                    resolvedNames.push(d.subCategoryName);
                }
                else if (d.mode === 'update') {
                    let subCatName = d.subCategoryName;
                    if (!subCatName) {
                        subCatName = (await this.subCategoryService.findOne(d.id)).subCategoryName
                    }
                    resolvedNames.push(subCatName);
                    resolvedIds.push(d.id);
                }
            }

            // duplicate subcategories
            const duplicateSubCats = this.helper.findDuplicates(
                resolvedNames,
                (name) => `${name}`
            );
            if (duplicateSubCats) {
                for (const dup of duplicateSubCats) {
                    this.addError({
                        errorMessage: 'Duplicate subcategory.',
                        errorType: 'DUPLICATE',
                        contextEntity: 'UpdateRecipeCategoryDto',
                        contextId: id,
                        sourceEntity: 'RecipeSubCategory',
                        value: dup,
                    } as ValidationError);
                }
            }

            // duplicate subcategory update dtos
            const duplicateIds = this.helper.findDuplicates(
                resolvedIds,
                (id) => `${id}`
            );
            if (duplicateIds) {
                for (const dup of duplicateIds) {
                    this.addError({
                        errorMessage: 'Multiple update requests for sub category',
                        errorType: 'DUPLICATE',
                        contextEntity: 'UpdateRecipeCategoryDto',
                        contextId: id,
                        sourceEntity: 'UpdateRecipeSubCategoryDto',
                        sourceId: dup,
                    } as ValidationError);
                }
            }
        }*/

    this.throwIfErrors();
  }
}
