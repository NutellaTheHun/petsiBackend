import { Injectable } from "@nestjs/common";
import { RecipeCategory } from "../entities/recipe-category.entity";
import { RecipeSubCategory } from "../entities/recipe-sub-category.entity";
import { RecipeSubCategoryService } from "../services/recipe-sub-category.service";
import { RecipeService } from "../services/recipe.service";

@Injectable()
export class RecipeCategoryBuilder {
    private category: RecipeCategory;

    constructor(
        private readonly subCategoryService: RecipeSubCategoryService,
        private readonly recipeService: RecipeService,
    ){ this.reset(); }

    public reset(): this {
        this.category = new RecipeCategory;
        return this;
    }

    public name(name: string): this {
        this.category.name = name;
        return this;
    }

    public async subCategoriesById(ids: number[]): Promise<this> {
        this.category.subCategories = await this.subCategoryService.findEntitiesById(ids);
        return this;
    }

    public async recipesById(ids: number[]): Promise<this> {
        this.category.recipes = await this.recipeService.findEntitiesById(ids);
        return this;
    }

    public getSubCategory(): RecipeCategory {
        const result = this.category;
        this.reset();
        return result;
    }
}