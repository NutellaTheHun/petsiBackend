import { BadRequestException, forwardRef, Inject } from "@nestjs/common";
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
import { CreateRecipeIngredientDto } from "../dto/recipe-ingredient/create-recipe-ingredient.dto";
import { Recipe } from "../entities/recipe.entity";

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

    /**
     * Depreciated, only created as a child through {@link Recipe}.
     */
    public async create(dto: CreateRecipeIngredientDto): Promise<RecipeIngredient> {
        throw new BadRequestException();
    }

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
                parentRecipe: { id }
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
                ingredientInventoryItem: invItem
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
                ingredientInventoryItem: invItem
            },
            relations
        })
    }
}