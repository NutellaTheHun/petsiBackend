import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { RecipeIngredient } from "../entities/recipe-ingredient.entity";
import { CreateRecipeIngredientDto } from "../dto/recipe-ingredient/create-recipe-ingredient.dto";
import { UpdateRecipeIngredientDto } from "../dto/recipe-ingredient/update-recipe-ingedient.dto";

@Injectable()
export class RecipeIngredientValidator extends ValidatorBase<RecipeIngredient> {
    constructor(
        @InjectRepository(RecipeIngredient)
        private readonly repo: Repository<RecipeIngredient>,
    ){ super(repo); }

    public async validateCreate(dto: CreateRecipeIngredientDto): Promise<string | null> {
        if(dto.ingredientInventoryItemId && dto.ingredientRecipeId){
            return 'recipe ingredient cannot reference both an inventory item and a subRecipeIngredient, only one.';
        }
        if(!dto.ingredientInventoryItemId && !dto.ingredientRecipeId){
            return 'recipe ingredient must reference either an inventory item and a subRecipeIngredient, none are given.';
        }
        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateRecipeIngredientDto): Promise<string | null> {
        if(dto.ingredientInventoryItemId && dto.ingredientRecipeId){
            return 'recipe ingredient cannot reference both an inventory item and a subRecipeIngredient';
        }
        if(dto.ingredientInventoryItemId || dto.ingredientRecipeId){
            const currentIngred = await this.repo.findOne({ where: { id }, relations: ['ingredientInventoryItem', 'ingredientRecipe']});

            if(dto.ingredientInventoryItemId && currentIngred?.ingredientRecipe){
                if(dto.ingredientRecipeId !== null){
                    return 'current ingredient has a recipe reference, set to null before updating to inventoryItemIngredient';
                }
            }

            if(dto.ingredientRecipeId && currentIngred?.ingredientInventoryItem){
                if(dto.ingredientRecipeId !== null){
                    return 'current ingredient has a inventoryitem reference, set to null before updating to reference a recipe as ingredient.';
                }
            }
        }
        return null;
    }
}