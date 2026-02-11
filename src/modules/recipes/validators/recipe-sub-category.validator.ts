import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NestedValidatorBase } from '../../../common/base/nested-validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateRecipeSubCategoryDto } from '../dto/recipe-sub-category/create-recipe-sub-category.dto';
import { NestedCreateRecipeSubCategoryDto } from '../dto/recipe-sub-category/nested-create-recipe-sub-category.dto';
import { NestedUpdateRecipeSubCategoryDto } from '../dto/recipe-sub-category/nested-update-recipe-sub-category.dto';
import { UpdateRecipeSubCategoryDto } from '../dto/recipe-sub-category/update-recipe-sub-category.dto';
import { RecipeCategory } from '../entities/recipe-category.entity';
import {
    RecipeSubCategory,
    RecipeSubCategoryEntity,
} from '../entities/recipe-sub-category.entity';
import { RecipeSubCategoryValidatorIdentity } from './identities/recipe-sub-category.validator.identity.interface';

@Injectable()
export class RecipeSubCategoryValidator extends NestedValidatorBase<RecipeSubCategoryEntity, RecipeSubCategoryValidatorIdentity> {
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

    protected async validateIdentity(identity: RecipeSubCategoryValidatorIdentity, id?: number | string): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        if (identity.name) {
            await this.helper.enforceUnique(
                identity.name,
                this.repo,
                'name',
                errorMap,
                id,
            );
        }

        if (identity.parentCategoryId) {
            await this.helper.enforceExists(
                identity.parentCategoryId,
                this.recipeCategoryRepo,
                'parentCategory',
                errorMap,
            );
        }

        return errorMap;
    }

    public async resolveIdentity(dto: CreateRecipeSubCategoryDto | UpdateRecipeSubCategoryDto | NestedCreateRecipeSubCategoryDto | NestedUpdateRecipeSubCategoryDto, id: number | string): Promise<RecipeSubCategoryValidatorIdentity> {
        return {
            id: dto instanceof NestedUpdateRecipeSubCategoryDto ? dto.id : undefined,
            createId: dto instanceof NestedCreateRecipeSubCategoryDto ? dto.createId : undefined,
            name: dto.name,
            parentCategoryId: dto instanceof CreateRecipeSubCategoryDto ? dto.parentCategoryId : undefined,
        } as RecipeSubCategoryValidatorIdentity;
    }
}
