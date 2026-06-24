import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NestedValidatorBase } from '../../../common/base/nested-validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { InventoryItem } from '../../inventory-items/entities/inventory-item.entity';
import { RequestContextService } from '../../request-context/RequestContextService';
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

        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(repo, 'RecipeIngredient', requestContextService, logger);
    }

    protected async validateIdentity(identity: RecipeIngredientValidatorIdentity, id: number | string): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        if (identity.ingredientInventoryItem !== undefined) {
            await this.helper.enforceExists(
                identity.ingredientInventoryItem,
                this.inventoryItemRepo,
                'ingredientInventoryItem',
                errorMap,
            );
        }

        if (identity.ingredientRecipe !== undefined) {
            await this.helper.enforceExists(
                identity.ingredientRecipe,
                this.recipeRepo,
                'ingredientRecipe',
                errorMap,
            );
            const ingredientRecipe = await this.recipeRepo.findOne({ where: { id: identity.ingredientRecipe } });
            if (ingredientRecipe && !ingredientRecipe.isIngredient) {
                errorMap.addError('INVALID_PROPERTY_VALUE', undefined, ['ingredientRecipe']);
            }
        }

        if (identity.parentRecipeId !== undefined) {
            await this.helper.enforceExists(
                identity.parentRecipeId,
                this.recipeRepo,
                'parentRecipe',
                errorMap,
            );
        }

        if (identity.quantity !== undefined) {
            this.helper.enforcePositive(
                identity.quantity,
                'quantity',
                errorMap,
            );
        }

        this.helper.enforceOnlyOne(
            identity,
            'ingredientInventoryItem',
            'ingredientRecipe',
            errorMap,
        );

        return errorMap;
    }

    public async resolveIdentity(dto: CreateRecipeIngredientDto | UpdateRecipeIngredientDto | NestedCreateRecipeIngredientDto | NestedUpdateRecipeIngredientDto, id: number | string): Promise<RecipeIngredientValidatorIdentity> {
        let parentRecipeId: number | undefined;
        if (dto instanceof CreateRecipeIngredientDto) {
            parentRecipeId = dto.parentRecipeId;
        } else if (dto instanceof NestedCreateRecipeIngredientDto) {
            parentRecipeId = undefined;
        } else { // If an update, we need to get the parent recipe id from the current ingredient
            const currentIngredient = await this.repo.findOne({ where: { id: id as number }, relations: ['parentRecipe'] });
            if (!currentIngredient) {
                throw new Error('Ingredient not found');
            }
            parentRecipeId = currentIngredient.parentRecipe.id;
        }

        return {
            id: dto instanceof NestedUpdateRecipeIngredientDto ? dto.id : undefined,
            createId: dto instanceof NestedCreateRecipeIngredientDto ? dto.createId : undefined,
            ingredientInventoryItem: dto.ingredientInventoryItemId,
            ingredientRecipe: dto.ingredientRecipeId,
            quantity: dto.quantity,
            unit: dto.unit,
            parentRecipeId: parentRecipeId,
        } as RecipeIngredientValidatorIdentity;
    }
}
