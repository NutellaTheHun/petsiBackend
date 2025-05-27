import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { ValidationError } from "../../../util/exceptions/validation-error";
import { CreateChildRecipeIngredientDto } from "../dto/recipe-ingredient/create-child-recipe-ingredient.dto";
import { UpdateChildRecipeIngredientDto } from "../dto/recipe-ingredient/update-child-recipe-ingedient.dto";
import { UpdateRecipeIngredientDto } from "../dto/recipe-ingredient/update-recipe-ingedient.dto";
import { RecipeIngredient } from "../entities/recipe-ingredient.entity";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";

@Injectable()
export class RecipeIngredientValidator extends ValidatorBase<RecipeIngredient> {
    constructor(
        @InjectRepository(RecipeIngredient)
        private readonly repo: Repository<RecipeIngredient>,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ) { super(repo, 'RecipeIngredient', requestContextService, logger); }

    public async validateCreate(dto: CreateChildRecipeIngredientDto): Promise<void> {
        if (dto.ingredientInventoryItemId && dto.ingredientRecipeId) {
            this.addError({
                errorMessage: 'Ingredient references both an inventory item and recipe',
                errorType: 'INVALID',
                contextEntity: 'CreateRecipeIngredientDto',
                sourceEntity: 'InventoryItem',
                sourceId: dto.ingredientInventoryItemId,
                conflictEntity: 'Recipe',
                conflictId: dto.ingredientRecipeId,
            } as ValidationError);
        }
        if (!dto.ingredientInventoryItemId && !dto.ingredientRecipeId) {
            this.addError({
                errorMessage: 'missing reference for ingredient',
                errorType: 'INVALID',
                contextEntity: 'CreateRecipeIngredientDto',
                sourceEntity: 'RecipeIngredient',
            } as ValidationError);
        }
        this.throwIfErrors()
    }

    public async validateUpdate(id: number, dto: UpdateRecipeIngredientDto | UpdateChildRecipeIngredientDto): Promise<void> {
        if (dto.ingredientInventoryItemId && dto.ingredientRecipeId) {
            this.addError({
                errorMessage: 'Ingredient references both an inventory item and recipe',
                errorType: 'INVALID',
                contextEntity: 'UpdateRecipeIngredientDto',
                contextId: id,
                sourceEntity: 'InventoryItem',
                sourceId: dto.ingredientInventoryItemId,
                conflictEntity: 'Recipe',
                conflictId: dto.ingredientRecipeId,
            } as ValidationError);
        }
        else if (dto.ingredientInventoryItemId || dto.ingredientRecipeId) {
            const currentIngred = await this.repo.findOne({ where: { id }, relations: ['ingredientInventoryItem', 'ingredientRecipe'] });
            if (!currentIngred) { throw new Error(); }

            if (dto.ingredientInventoryItemId && currentIngred?.ingredientRecipe) {
                if (dto.ingredientRecipeId !== null) {
                    this.addError({
                        errorMessage: 'Ingredient currently references a recipe, cannot reference both a inventory item and recipe',
                        errorType: 'INVALID',
                        contextEntity: 'UpdateRecipeIngredientDto',
                        contextId: id,
                        sourceEntity: 'InventoryItem',
                        sourceId: dto.ingredientInventoryItemId,
                        conflictEntity: 'Recipe',
                        conflictId: currentIngred.ingredientRecipe.id,
                    } as ValidationError);
                }
            }

            if (dto.ingredientRecipeId && currentIngred?.ingredientInventoryItem) {
                if (dto.ingredientInventoryItemId !== null) {
                    this.addError({
                        errorMessage: 'Ingredient currently references a inventory item, cannot reference both a inventory item and recipe',
                        errorType: 'INVALID',
                        contextEntity: 'UpdateRecipeIngredientDto',
                        contextId: id,
                        sourceEntity: 'Recipe',
                        sourceId: dto.ingredientRecipeId,
                        conflictEntity: 'InventoryItem',
                        conflictId: currentIngred.ingredientInventoryItem.id,
                    } as ValidationError);
                }
            }
        }
        this.throwIfErrors()
    }
}