import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { ValidationError } from "../../../util/exceptions/validation-error";
import { CreateChildRecipeIngredientDto } from "../dto/recipe-ingredient/create-child-recipe-ingredient.dto";
import { UpdateChildRecipeIngredientDto } from "../dto/recipe-ingredient/update-child-recipe-ingedient.dto";
import { UpdateRecipeIngredientDto } from "../dto/recipe-ingredient/update-recipe-ingedient.dto";
import { RecipeIngredient } from "../entities/recipe-ingredient.entity";

@Injectable()
export class RecipeIngredientValidator extends ValidatorBase<RecipeIngredient> {
    constructor(
        @InjectRepository(RecipeIngredient)
        private readonly repo: Repository<RecipeIngredient>,
    ) { super(repo); }

    public async validateCreate(dto: CreateChildRecipeIngredientDto): Promise<void> {
        if (dto.ingredientInventoryItemId && dto.ingredientRecipeId) {
            this.addError({
                error: 'Ingredient references both an inventory item and recipe',
                status: 'INVALID',
                contextEntity: 'CreateRecipeIngredientDto',
                sourceEntity: 'InventoryItem',
                sourceId: dto.ingredientInventoryItemId,
                conflictEntity: 'Recipe',
                conflictId: dto.ingredientRecipeId,
            } as ValidationError);
        }
        if (!dto.ingredientInventoryItemId && !dto.ingredientRecipeId) {
            this.addError({
                error: 'missing reference for ingredient',
                status: 'INVALID',
                contextEntity: 'CreateRecipeIngredientDto',
                sourceEntity: 'RecipeIngredient',
            } as ValidationError);
        }
        this.throwIfErrors()
    }

    public async validateUpdate(id: number, dto: UpdateRecipeIngredientDto | UpdateChildRecipeIngredientDto): Promise<void> {
        if (dto.ingredientInventoryItemId && dto.ingredientRecipeId) {
            this.addError({
                error: 'Ingredient references both an inventory item and recipe',
                status: 'INVALID',
                contextEntity: 'UpdateRecipeIngredientDto',
                contextId: id,
                sourceEntity: 'InventoryItem',
                sourceId: dto.ingredientInventoryItemId,
                conflictEntity: 'Recipe',
                conflictId: dto.ingredientRecipeId,
            } as ValidationError);
        }
        if (dto.ingredientInventoryItemId || dto.ingredientRecipeId) {
            const currentIngred = await this.repo.findOne({ where: { id }, relations: ['ingredientInventoryItem', 'ingredientRecipe'] });
            if (!currentIngred) { throw new Error(); }

            if (dto.ingredientInventoryItemId && currentIngred?.ingredientRecipe) {
                if (dto.ingredientRecipeId !== null) {
                    this.addError({
                        error: 'Ingredient currently references a recipe, cannot reference both a inventory item and recipe',
                        status: 'INVALID',
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
                        error: 'Ingredient currently references a inventory item, cannot reference both a inventory item and recipe',
                        status: 'INVALID',
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