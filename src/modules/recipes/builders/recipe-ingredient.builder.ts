import { Injectable } from "@nestjs/common";
import { RecipeIngredient } from "../entities/recipe-ingredient.entity";
import { RecipeService } from "../services/recipe.service";
import { InventoryItemService } from "../../inventory-items/services/inventory-item.service";
import { UnitOfMeasureService } from "../../unit-of-measure/services/unit-of-measure.service";

@Injectable()
export class RecipeIngredientBuilder {
    private ingredient: RecipeIngredient;

    constructor(
        private readonly recipeService: RecipeService,
        private readonly inventoryItemService: InventoryItemService,
        private readonly unitOfMeasureService: UnitOfMeasureService,
    ){ this.reset(); }

    public reset(): this {
        this.ingredient = new RecipeIngredient;
        return this;
    }

    public async recipeById(id: number): Promise<this> {
        const recipe = await this.recipeService.findOne(id);
        if(!recipe){ throw new Error("recipe not found"); }

        this.ingredient.recipe = recipe;
        return this;
    }

    public async recipeByName(name: string): Promise<this> {
        const recipe = await this.recipeService.findOneByName(name);
        if(!recipe){ throw new Error("recipe not found"); }

        this.ingredient.recipe = recipe;
        return this;
    }

    public async inventoryItemById(id: number): Promise<this> {
        const item = await this.inventoryItemService.findOne(id);
        if(!item){ throw new Error("inventory item not found"); }

        this.ingredient.inventoryItem = item;
        return this;
    }

    public async inventoryItemByName(name: string): Promise<this> {
        const item = await this.inventoryItemService.findOneByName(name);
        if(!item){ throw new Error("inventory item not found"); }

        this.ingredient.inventoryItem = item;
        return this;
    }

    public async subRecipeById(id: number): Promise<this> {
        const recipe = await this.recipeService.findOne(id);
        if(!recipe){ throw new Error("sub recipe not found"); }

        this.ingredient.subRecipeIngredient = recipe;
        return this;
    }

    public async subRecipeByName(name: string): Promise<this> {
        const recipe = await this.recipeService.findOneByName(name);
        if(!recipe){ throw new Error("sub recipe not found"); }

        this.ingredient.subRecipeIngredient = recipe;
        return this;
    }

    public quantity(amount: number): this {
        this.ingredient.quantity = amount;
        return this;
    }

    public async unitOfMeasureById(id: number): Promise<this> {
        const unit = await this.unitOfMeasureService.findOne(id);
        if(!unit){ throw new Error("unit of measure not found"); }

        this.ingredient.unit = unit;
        return this;
    }

    public async unitOfMeasureByName(name: string): Promise<this> {
        const unit = await this.unitOfMeasureService.findOneByName(name);
        if(!unit){ throw new Error("unit of measure not found"); }

        this.ingredient.unit = unit;
        return this;
    }

    public getIngredient(): RecipeIngredient {
        const result = this.ingredient;
        this.reset();
        return result;
    }
}