import { forwardRef, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { InventoryItemService } from "../../inventory-items/services/inventory-item.service";
import { RecipeIngredientBuilder } from "../builders/recipe-ingredient.builder";
import { CreateRecipeIngredientDto } from "../dto/create-recipe-ingredient.dto";
import { UpdateRecipeIngredientDto } from "../dto/update-recipe-ingedient.dto";
import { RecipeIngredient } from "../entities/recipe-ingredient.entity";
import { RecipeService } from "./recipe.service";

export class RecipeIngredientService extends ServiceBase<RecipeIngredient>{
    constructor(
        @InjectRepository(RecipeIngredient)
        private readonly ingredientRepo: Repository<RecipeIngredient>,
        private readonly ingredientBuilder: RecipeIngredientBuilder,

        @Inject(forwardRef(() => RecipeService))
        private readonly recipeService: RecipeService,
        private readonly inventoryItemService: InventoryItemService,
    ){ super(ingredientRepo); }

    /**
     * A recipe ingredient cannot reference both an inventory item and subRecipeIngredient, only one.
     * Should be checked at controller level
     */
    async create(createDto: CreateRecipeIngredientDto): Promise<RecipeIngredient | null> {
        const recipe = await this.recipeService.findOne(createDto.recipeId);
        if(!recipe){ 
            throw new Error("recipe not found"); 
        }

        const ingredient = await this.ingredientBuilder.buildCreateDto(createDto);
        return await this.ingredientRepo.save(ingredient);
    }
    
    /**
    * - Uses Repository.Save(), NOT UPDATE
    * - inventoryItem and subRecipe cannot be both assigned, only one, handled at controller level
    */
    async update(id: number, updateDto: UpdateRecipeIngredientDto): Promise< RecipeIngredient | null> {
        const toUpdate = await this.findOne(id);
        if(!toUpdate){ return null; }
        
        await this.ingredientBuilder.buildUpdateDto(toUpdate, updateDto);
        return await this.ingredientRepo.save(toUpdate);
    }

    async findByRecipeName(name: string, relations?:string[]): Promise<RecipeIngredient[]>{
        const recipe = await this.recipeService.findOneByName(name, ["ingredients"]);
        if(!recipe?.ingredients){
            throw new Error("recipe ingredients not found");
        }
        return recipe.ingredients;
    }

    async findByInventoryItemName(name: string, relations?:string[]): Promise<RecipeIngredient[]>{
        const invItem = await this.inventoryItemService.findOneByName(name);
        if(!invItem){
            throw new Error('inventory item not found');
        }

        return await this.ingredientRepo.find({
            where: {
                inventoryItem: invItem
            },
            relations
        })
    }
}