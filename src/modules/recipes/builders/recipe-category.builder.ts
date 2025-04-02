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
    private taskQueue: (() => Promise<void>)[];

    private subCategoryMethods: BuilderMethodBase<RecipeSubCategory>;
    private recipeMethods: BuilderMethodBase<Recipe>;
    
    constructor(
        @Inject(forwardRef(() => RecipeService))
        private readonly subCategoryService: RecipeSubCategoryService,
        
        @Inject(forwardRef(() => RecipeSubCategoryService))
        private readonly recipeService: RecipeService,
    ){ 
        this.reset(); 
        this.taskQueue = [];
        this.subCategoryMethods = new BuilderMethodBase(this.subCategoryService, this.subCategoryService.findOneByName.bind(this.subCategoryService));
        this.recipeMethods = new BuilderMethodBase(this.recipeService, this.recipeService.findOneByName.bind(this.recipeService));
    }

    public reset(): this {
        this.category = new RecipeCategory;
        this.taskQueue = [];
        return this;
    }

    public name(name: string): this {
        this.category.name = name;
        return this;
    }

    public subCategoriesById(ids: number[]): this {
        this.taskQueue.push(async () => {
            await this.subCategoryMethods.entityByIds(
                (subs) => { this.category.subCategories = subs; },
                ids,
            );
        });
        return this;
    }

    public recipesById(ids: number[]): this {
        this.taskQueue.push(async () => {
            await this.recipeMethods.entityByIds(
                (recs) => { this.category.recipes = recs; },
                ids,
            );
        });
        return this;
    }

    public async build(): Promise<RecipeCategory> {
        for(const task of this.taskQueue){
            await task();
        }

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
            this.recipesById(dto.recipeIds);
        }
        if(dto.subCategoryIds){
            this.subCategoriesById(dto.subCategoryIds);
        }

        return this.build();
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
            this.recipesById(dto.recipeIds);
        }
        if(dto.subCategoryIds){
            this.subCategoriesById(dto.subCategoryIds);
        }

        return this.build();
    }
}