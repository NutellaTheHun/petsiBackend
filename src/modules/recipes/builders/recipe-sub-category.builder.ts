import { Injectable } from "@nestjs/common";
import { RecipeSubCategory } from "../entities/recipe-sub-category.entity";
import { RecipeCategoryService } from "../services/recipe-category.service";
import { RecipeService } from "../services/recipe.service";

@Injectable()
export class RecipeSubCategoryBuilder{
    private subCategory: RecipeSubCategory

    constructor(
        private readonly categoryService: RecipeCategoryService,
        private readonly recipeService: RecipeService,
    ){ this.reset(); }

    public reset(): this {
        this.subCategory = new RecipeSubCategory;
        return this;
    }

    public name(name: string): this {
        this.subCategory.name = name;
        return this;
    }

    public async parentCategoryById(id: number): Promise<this> {
        const category = await this.categoryService.findOne(id);
        if(!category){ throw new Error("category not found"); }

        this.subCategory.parentCategory = category;
        return this;
    }

    public async parentCategoryByName(name: string): Promise<this> {
        const category = await this.categoryService.findOneByName(name);
        if(!category){ throw new Error("category not found"); }

        this.subCategory.parentCategory = category;
        return this;
    }

    public async recipesById(ids: number[]): Promise<this> {
        this.subCategory.recipes = await this.recipeService.findEntitiesById(ids);
        return this;
    }

    public getSubCategory(): RecipeSubCategory{
        const result = this.subCategory;
        this.reset();
        return result;
    }
}