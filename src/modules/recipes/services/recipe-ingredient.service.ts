import { forwardRef, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { RequestContextService } from "../../request-context/RequestContextService";
import { InventoryItemService } from "../../inventory-items/services/inventory-item.service";
import { AppLogger } from "../../app-logging/app-logger";
import { RecipeIngredientBuilder } from "../builders/recipe-ingredient.builder";
import { RecipeIngredient } from "../entities/recipe-ingredient.entity";
import { RecipeIngredientValidator } from "../validators/recipe-ingredient.validator";
import { RecipeService } from "./recipe.service";

export class RecipeIngredientService extends ServiceBase<RecipeIngredient>{
    constructor(
        @InjectRepository(RecipeIngredient)
        private readonly ingredientRepo: Repository<RecipeIngredient>,

        @Inject(forwardRef(() => RecipeIngredientBuilder))
        ingredientBuilder: RecipeIngredientBuilder,

        validator: RecipeIngredientValidator,

        @Inject(forwardRef(() => RecipeService))
        private readonly recipeService: RecipeService,
        private readonly inventoryItemService: InventoryItemService,
        requestContextService: RequestContextService,
        logger: AppLogger,
    ){ super(ingredientRepo, ingredientBuilder, validator, 'RecipeIngredientService', requestContextService, logger); }

    async findByRecipeName(name: string, relations?: Array<keyof RecipeIngredient>): Promise<RecipeIngredient[]>{
        const recipe = await this.recipeService.findOneByName(name, ["ingredients"]);
        if(!recipe?.ingredients){
            throw new Error("recipe ingredients not found");
        }
        return recipe.ingredients;
    }

    async findByRecipeId(id: number, relations?: Array<keyof RecipeIngredient>): Promise<RecipeIngredient[]>{
        return await this.ingredientRepo.find({
            where: {
                recipe: { id }
            },
            relations
        })
    }

    async findByInventoryItemName(name: string, relations?: Array<keyof RecipeIngredient>): Promise<RecipeIngredient[]>{
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

    async findByInventoryItemId(id: number, relations?: Array<keyof RecipeIngredient>): Promise<RecipeIngredient[]>{
        const invItem = await this.inventoryItemService.findOne(id);
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