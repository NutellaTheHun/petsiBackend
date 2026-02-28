import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { createValidationErrorPayload, ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { RequestContextService } from '../../request-context/RequestContextService';
import { UnitOfMeasure } from '../../unit-of-measure/entities/unit-of-measure.entity';
import { NestedCreateRecipeIngredientDto } from '../dto/recipe-ingredient/nested-create-recipe-ingredient.dto';
import { CreateRecipeDto } from '../dto/recipe/create-recipe.dto';
import { UpdateRecipeDto } from '../dto/recipe/update-recipe-dto';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { RecipeSubCategory } from '../entities/recipe-sub-category.entity';
import { Recipe, RecipeEntity } from '../entities/recipe.entity';
import { RecipeIngredientValidatorIdentity } from './identities/recipe-ingredient.validator.identity.interface';
import { RecipeValidatorIdentity } from './identities/recipe.validator.identity.interface';
import { RecipeIngredientValidator } from './recipe-ingredient.validator';

@Injectable()
export class RecipeValidator extends ValidatorBase<RecipeEntity, RecipeValidatorIdentity> {
    constructor(
        @InjectRepository(Recipe)
        private readonly repo: Repository<Recipe>,
        @InjectRepository(RecipeCategory)
        private readonly recipeCategoryRepo: Repository<RecipeCategory>,

        private readonly ingredientValidator: RecipeIngredientValidator,

        @InjectRepository(UnitOfMeasure)
        private readonly unitOfMeasureRepo: Repository<UnitOfMeasure>,

        @InjectRepository(MenuItem)
        private readonly menuItemRepo: Repository<MenuItem>,

        @InjectRepository(RecipeSubCategory)
        private readonly recipeSubCategoryRepo: Repository<RecipeSubCategory>,

        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(repo, 'Recipe', requestContextService, logger);
    }

    protected async validateIdentity(identity: RecipeValidatorIdentity, id: number | string): Promise<ValidationErrorMap> {
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

        if (identity.batchResultQuantity !== undefined && identity.batchResultQuantity !== null) {
            this.helper.enforcePositive(
                identity.batchResultQuantity,
                'batchResultQuantity',
                errorMap,
            );
        }

        if (identity.batchResultUnitType !== undefined && identity.batchResultUnitType !== null) {
            await this.helper.enforceExists(
                identity.batchResultUnitType,
                this.unitOfMeasureRepo,
                'batchResultUnitType',
                errorMap,
            );
        }

        if (identity.categoryId !== undefined && identity.categoryId !== null) {
            await this.helper.enforceExists(
                identity.categoryId,
                this.recipeCategoryRepo,
                'category',
                errorMap,
            );
        }

        if (identity.producedMenuItemId !== undefined && identity.producedMenuItemId !== null) {
            await this.helper.enforceExists(
                identity.producedMenuItemId,
                this.menuItemRepo,
                'producedMenuItem',
                errorMap,
            );
        }

        if (identity.salesPrice !== undefined && identity.salesPrice !== null) {
            this.helper.enforcePositive(
                identity.salesPrice,
                'salesPrice',
                errorMap,
            );
        }

        if (identity.servingSizeQuantity !== undefined && identity.servingSizeQuantity !== null) {
            this.helper.enforcePositive(
                identity.servingSizeQuantity,
                'servingSizeQuantity',
                errorMap,
            );
        }
        if (identity.servingSizeUnitType !== undefined && identity.servingSizeUnitType !== null) {
            await this.helper.enforceExists(
                identity.servingSizeUnitType,
                this.unitOfMeasureRepo,
                'servingSizeUnitType',
                errorMap,
            );
        }

        if (identity.subCategoryId !== undefined && identity.subCategoryId !== null) {
            await this.helper.enforceExists(
                identity.subCategoryId,
                this.recipeSubCategoryRepo,
                'subCategory',
                errorMap,
            );
        }

        if (identity.subCategoryId && !identity.categoryId) {
            errorMap.addError('INVALID_PROPERTY_VALUE', undefined, ['subCategory']);
        }

        if (identity.subCategoryId && identity.categoryId) {
            await this.helper.enforceValidSize(
                identity.subCategoryId,
                identity.categoryId,
                this.recipeCategoryRepo,
                'subCategories',
                'subCategory',
                errorMap,
            );
        }

        if (identity.batchResultQuantity || identity.batchResultUnitType) {
            this.helper.enforceMutualRequired(
                identity,
                ['batchResultQuantity', 'batchResultUnitType'],
                errorMap,
            );
        }

        if (identity.servingSizeQuantity || identity.servingSizeUnitType) {
            this.helper.enforceMutualRequired(
                identity,
                ['servingSizeQuantity', 'servingSizeUnitType'],
                errorMap,
            );
        }

        if (identity.ingredients && identity.ingredients.length) {

            this.helper.enforceNoDuplicateElements(
                identity.ingredients,
                (ingredient) => ({ id: ingredient.id ?? ingredient.createId, identity: `${ingredient.ingredientInventoryItem}:${ingredient.ingredientRecipe}` }),
                'ingredients',
                errorMap,
            );

            for (const ingredient of identity.ingredients) {
                // An ingredient cannot be added to itself
                if (ingredient.ingredientRecipe === id) {
                    const errorPayload = createValidationErrorPayload('INVALID_PROPERTY_VALUE', undefined, ['ingredientRecipe']);
                    errorMap.addChild('ingredients', new ValidationErrorMap(ingredient.id ?? ingredient.createId, [errorPayload]));
                }

                await this.ingredientValidator.validateNestedIdentity(
                    'ingredients',
                    ingredient,
                    errorMap,
                );
            }
        }

        return errorMap;
    }

    public async resolveIdentity(dto: CreateRecipeDto | UpdateRecipeDto, id: number | string): Promise<RecipeValidatorIdentity> {
        const ingredientIdentities: RecipeIngredientValidatorIdentity[] = [];
        if (dto.ingredients && dto.ingredients.length) {
            for (const ingredient of dto.ingredients) {
                const ingredientId = ingredient instanceof NestedCreateRecipeIngredientDto ? ingredient.createId : ingredient.id;
                ingredientIdentities.push(await this.ingredientValidator.resolveIdentity(ingredient, ingredientId));
            }
        }

        return {
            name: dto.name,
            producedMenuItemId: dto.producedMenuItemId,
            batchResultQuantity: dto.batchResultQuantity,
            batchResultUnitType: dto.batchResultUnitTypeId,
            servingSizeQuantity: dto.servingSizeQuantity,
            servingSizeUnitType: dto.servingSizeUnitTypeId,
            salesPrice: dto.salesPrice,
            isIngredient: dto.isIngredient,
            categoryId: dto.categoryId,
            subCategoryId: dto.subCategoryId,
            ingredients: ingredientIdentities,
        } as RecipeValidatorIdentity;
    }
}
