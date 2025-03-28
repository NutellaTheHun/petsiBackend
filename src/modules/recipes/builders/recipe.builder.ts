import { Injectable } from "@nestjs/common";
import { Recipe } from "../entities/recipe.entity";
import { MenuItemsService } from "../../menu-items/menu-items.service";
import { RecipeIngredientService } from "../services/recipe-ingredient.service";
import { UnitOfMeasureService } from "../../unit-of-measure/services/unit-of-measure.service";
import { RecipeCategoryService } from "../services/recipe-category.service";
import { RecipeSubCategoryService } from "../services/recipe-sub-category.service";

@Injectable()
export class RecipeBuilder {
    private recipe: Recipe;

    constructor(
        //private readonly menuItemService: MenuItemsService,
        private readonly ingredientService: RecipeIngredientService,
        private readonly measureService: UnitOfMeasureService,
        private readonly categoryService: RecipeCategoryService,
        private readonly subCategoryService: RecipeSubCategoryService,
    ){ this.reset(); }

    public reset(): this {
        this.recipe = new Recipe;
        return this
    }

    public name(name: string): this {
        this.recipe.name = name;
        return this;
    }
    /*
    public menuItemById(id: number): this {
        const item = await this.menuItemService.findOne(id);
        if(!item){ throw new Error("menu item not found"); }

        this.recipe.menuItem = item;
        return this;
    }

    public menuItemByName(name: string): this {
        const item = await this.menuItemService.findOneByName(name);
        if(!item){ throw new Error("menu item not found"); }

        this.recipe.menuItem = item;
        return this;
    }*/

    public isIngredient(value: boolean): this {
        this.recipe.isIngredient = value;
        return this;
    }

    public async ingredientsById(ids: number[]): Promise<this> {
        this.recipe.ingredients = await this.ingredientService.findEntitiesById(ids);
        return this;
    }

    public batchResultQuantity(amount: number): this {
        this.recipe.batchResultQuantity = amount;
        return this;
    }

    public async batchResultUnitOfMeasureById(id: number): Promise<this> {
        const unit = await this.measureService.findOne(id);
        if(!unit){ throw new Error("batch unit of measure not found"); }

        this.recipe.batchResultUnitOfMeasure = unit;
        return this;
    }

    public async batchResultUnitOfMeasureByName(name: string): Promise<this> {
        const unit = await this.measureService.findOneByName(name);
        if(!unit){ throw new Error("batch unit of measure not found"); }

        this.recipe.batchResultUnitOfMeasure = unit;
        return this;
    }

    public servingSizeQuantity(amount: number): this {
        this.recipe.servingSizeQuantity = amount;
        return this;
    }
}