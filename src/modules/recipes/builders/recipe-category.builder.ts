import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderMethodBase } from "../../../base/builder-method-base";
import { CreateRecipeCategoryDto } from "../dto/create-recipe-category.dto";
import { UpdateRecipeCategoryDto } from "../dto/update-recipe-category.dto";
import { RecipeCategory } from "../entities/recipe-category.entity";
import { RecipeSubCategory } from "../entities/recipe-sub-category.entity";
import { Recipe } from "../entities/recipe.entity";
import { RecipeSubCategoryService } from "../services/recipe-sub-category.service";
import { RecipeService } from "../services/recipe.service";

@Injectable()
export class RecipeCategoryBuilder {
    private category: RecipeCategory;
    private subCategoryMethods: BuilderMethodBase<RecipeSubCategory>;
    private recipeMethods: BuilderMethodBase<Recipe>;
    
    constructor(
        @Inject(forwardRef(() => RecipeService))
        private readonly subCategoryService: RecipeSubCategoryService,
        
        @Inject(forwardRef(() => RecipeSubCategoryService))
        private readonly recipeService: RecipeService,
    ){ 
        this.reset(); 
        this.subCategoryMethods = new BuilderMethodBase(this.subCategoryService, this.subCategoryService.findOneByName.bind(this.subCategoryService));
        this.recipeMethods = new BuilderMethodBase(this.recipeService, this.recipeService.findOneByName.bind(this.recipeService));
    }

    public reset(): this {
        this.category = new RecipeCategory;
        return this;
    }

    public name(name: string): this {
        this.category.name = name;
        return this;
    }

    public async subCategoriesById(ids: number[]): Promise<this> {
        await this.subCategoryMethods.entityByIds(
            (subs) => { this.category.subCategories = subs; },
            ids,
        );
        return this;
    }

    public async recipesById(ids: number[]): Promise<this> {
        await this.recipeMethods.entityByIds(
            (recs) => { this.category.recipes = recs; },
            ids,
        );
        return this;
    }

    public getCategory(): RecipeCategory {
        const result = this.category;
        this.reset();
        return result;
    }

    public async buildCreateDto(dto: CreateRecipeCategoryDto): Promise<RecipeCategory> {
        this.reset();

        if(dto.name){
            this.name(dto.name);
        }
        if(dto.recipeIds){
            await this.recipesById(dto.recipeIds);
        }
        if(dto.subCategoryIds){
            await this.subCategoriesById(dto.subCategoryIds);
        }

        return this.getCategory();
    }

    public updateCategory(toUpdate: RecipeCategory): this{
        this.category = toUpdate;
        return this;
    }

     // handle if clearing all recipes?
      // handle if clearing all sub-recipes?
    public async buildUpdateDto(toUpdate: RecipeCategory, dto: UpdateRecipeCategoryDto): Promise<RecipeCategory> {
        this.reset();
        this.updateCategory(toUpdate);

        if(dto.name){
            this.name(dto.name);
        }
        if(dto.recipeIds){
            await this.recipesById(dto.recipeIds);
        }
        if(dto.subCategoryIds){
            await this.subCategoriesById(dto.subCategoryIds);
        }

        return this.getCategory();
    }
}