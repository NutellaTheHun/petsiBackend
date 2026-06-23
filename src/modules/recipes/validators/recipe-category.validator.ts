import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateRecipeCategoryDto } from '../dto/recipe-category/create-recipe-category.dto';
import { UpdateRecipeCategoryDto } from '../dto/recipe-category/update-recipe-category.dto';
import { NestedCreateRecipeSubCategoryDto } from '../dto/recipe-sub-category/nested-create-recipe-sub-category.dto';
import {
    RecipeCategory,
    RecipeCategoryEntity,
} from '../entities/recipe-category.entity';
import { RecipeCategoryValidatorIdentity } from './identities/recipe-category.validator.identity.interface';
import { RecipeSubCategoryValidatorIdentity } from './identities/recipe-sub-category.validator.identity.interface';
import { RecipeSubCategoryValidator } from './recipe-sub-category.validator';
@Injectable()
export class RecipeCategoryValidator extends ValidatorBase<RecipeCategoryEntity, RecipeCategoryValidatorIdentity> {
    constructor(
        @InjectRepository(RecipeCategory)
        private readonly repo: Repository<RecipeCategory>,

        private readonly subCategoryValidator: RecipeSubCategoryValidator,

        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(repo, 'RecipeCategory', requestContextService, logger);
    }

    protected async validateIdentity(identity: RecipeCategoryValidatorIdentity, id: number | string): Promise<ValidationErrorMap> {
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

        if (identity.subCategories && identity.subCategories.length) {

            this.helper.enforceNoDuplicateElements(
                identity.subCategories,
                (item) => ({ id: item.id ?? item.createId, identity: item.name ?? '' }),
                'subCategories',
                errorMap,
            );

            for (const subCategory of identity.subCategories) {
                await this.subCategoryValidator.validateNestedIdentity(
                    'subCategories',
                    subCategory,
                    errorMap,
                );
            }
        }

        return errorMap;
    }

    public async resolveIdentity(dto: CreateRecipeCategoryDto | UpdateRecipeCategoryDto, id: number | string): Promise<RecipeCategoryValidatorIdentity> {
        const subCategories: RecipeSubCategoryValidatorIdentity[] = [];
        if (dto.subCategories && dto.subCategories.length) {
            for (const subCategory of dto.subCategories) {
                const subCategoryId = subCategory instanceof NestedCreateRecipeSubCategoryDto ? subCategory.createId : subCategory.id;
                const resolved = await this.subCategoryValidator.resolveIdentity(
                    subCategory,
                    subCategoryId,
                );
                if (
                    dto instanceof UpdateRecipeCategoryDto &&
                    subCategory instanceof NestedCreateRecipeSubCategoryDto
                ) {
                    subCategories.push({
                        ...resolved,
                        parentCategoryId: id as number,
                    });
                    continue;
                }
                subCategories.push(resolved);
            }
        }
        return {
            name: dto.name,
            subCategories: subCategories,
        } as RecipeCategoryValidatorIdentity;
    }
}
