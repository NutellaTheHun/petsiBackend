import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NestedValidatorBase } from '../../../common/base/nested-validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { InventoryItem } from '../../inventory-items/entities/inventory-item.entity';
import { RequestContextService } from '../../request-context/RequestContextService';
import { UnitOfMeasure } from '../../unit-of-measure/entities/unit-of-measure.entity';
import { CreateRecipeIngredientDto } from '../dto/recipe-ingredient/create-recipe-ingredient.dto';
import { NestedCreateRecipeIngredientDto } from '../dto/recipe-ingredient/nested-create-recipe-ingredient.dto';
import { NestedUpdateRecipeIngredientDto } from '../dto/recipe-ingredient/nested-update-recipe-ingedient.dto';
import { UpdateRecipeIngredientDto } from '../dto/recipe-ingredient/update-recipe-ingedient.dto';
import {
    RecipeIngredient,
    RecipeIngredientEntity,
} from '../entities/recipe-ingredient.entity';
import { Recipe } from '../entities/recipe.entity';
import { RecipeIngredientValidatorIdentity } from './identities/recipe-ingredient.validator.identity.interface';

@Injectable()
export class RecipeIngredientValidator extends NestedValidatorBase<RecipeIngredientEntity, RecipeIngredientValidatorIdentity> {

    constructor(
        @InjectRepository(RecipeIngredient)
        private readonly repo: Repository<RecipeIngredient>,

        @InjectRepository(InventoryItem)
        private readonly inventoryItemRepo: Repository<InventoryItem>,

        @InjectRepository(Recipe)
        private readonly recipeRepo: Repository<Recipe>,

        @InjectRepository(UnitOfMeasure)
        private readonly unitOfMeasureRepo: Repository<UnitOfMeasure>,

        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(repo, 'RecipeIngredient', requestContextService, logger);
    }

    protected async validateIdentity(identity: RecipeIngredientValidatorIdentity, id?: number | string): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        if (identity.ingredientInventoryItemId) {
            await this.helper.enforceExists(
                identity.ingredientInventoryItemId,
                this.inventoryItemRepo,
                'ingredientInventoryItem',
                errorMap,
            );
        }

        if (identity.ingredientRecipeId) {
            await this.helper.enforceExists(
                identity.ingredientRecipeId,
                this.repo,
                'ingredientRecipe',
                errorMap,
            );
        }

        if (identity.parentRecipeId) {
            await this.helper.enforceExists(
                identity.parentRecipeId,
                this.recipeRepo,
                'parentRecipe',
                errorMap,
            );
        }

        if (identity.quantity) {
            this.helper.enforcePositive(
                identity.quantity,
                'quantity',
                errorMap,
            );
        }

        if (identity.quantityUnitTypeId) {
            await this.helper.enforceExists(
                identity.quantityUnitTypeId,
                this.unitOfMeasureRepo,
                'quantityUnitType',
                errorMap,
            );
        }

        if (identity.ingredientInventoryItemId || identity.ingredientRecipeId) {
            this.helper.enforceOnlyOne(
                identity,
                'ingredientInventoryItemId',
                'ingredientRecipeId',
                errorMap,
            );
        }

        if (identity.parentRecipeId && identity.ingredientRecipeId) {
            if (identity.ingredientRecipeId === identity.parentRecipeId) {
                errorMap.addError('INVALID_PROPERTY_VALUE', undefined, ['ingredientRecipe', 'parentRecipe']);
            }
        }

        return errorMap;
    }

    public async resolveIdentity(dto: CreateRecipeIngredientDto | UpdateRecipeIngredientDto | NestedCreateRecipeIngredientDto | NestedUpdateRecipeIngredientDto, id: number | string): Promise<RecipeIngredientValidatorIdentity> {
        return {
            id: dto instanceof NestedUpdateRecipeIngredientDto ? dto.id : undefined,
            createId: dto instanceof NestedCreateRecipeIngredientDto ? dto.createId : undefined,
            ingredientInventoryItemId: dto.ingredientInventoryItemId,
            ingredientRecipeId: dto.ingredientRecipeId,
            quantity: dto.quantity,
            quantityUnitTypeId: dto.quantityUnitTypeId,
            parentRecipeId: dto instanceof CreateRecipeIngredientDto ? dto.parentRecipeId : undefined,
        } as RecipeIngredientValidatorIdentity;
    }
}
