import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { RecipeIngredient } from "../entities/recipe-ingredient.entity";
import { CreateRecipeIngredientDto } from "../dto/create-recipe-ingredient.dto";
import { UpdateRecipeIngredientDto } from "../dto/update-recipe-ingedient.dto";

@Injectable()
export class RecipeIngredientValidator extends ValidatorBase<RecipeIngredient> {
    constructor(
        @InjectRepository(RecipeIngredient)
        private readonly repo: Repository<RecipeIngredient>,
    ){ super(repo); }

    public async validateCreate(dto: CreateRecipeIngredientDto): Promise<string | null> {
        if(dto.inventoryItemId && dto.subRecipeIngredientId){
            return 'recipe ingredient cannot reference both an inventory item and a subRecipeIngredient';
        }
        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateRecipeIngredientDto): Promise<string | null> {
        if(dto.inventoryItemId && dto.subRecipeIngredientId){
            return 'recipe ingredient cannot reference both an inventory item and a subRecipeIngredient';
        }
        return null;
    }
}