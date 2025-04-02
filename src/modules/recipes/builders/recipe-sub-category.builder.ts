import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { RecipeSubCategory } from "../entities/recipe-sub-category.entity";
import { RecipeCategoryService } from "../services/recipe-category.service";
import { RecipeService } from "../services/recipe.service";
import { BuilderMethodBase } from "../../../base/builder-method-base";
import { Recipe } from "../entities/recipe.entity";
import { RecipeCategory } from "../entities/recipe-category.entity";
import { CreateRecipeSubCategoryDto } from "../dto/create-recipe-sub-category.dto";
import { UpdateRecipeSubCategoryDto } from "../dto/update-recipe-sub-category.dto";

@Injectable()
export class RecipeSubCategoryBuilder{
    private subCategory: RecipeSubCategory
    private taskQueue: (() => Promise<void>)[];

    private categoryMethods: BuilderMethodBase<RecipeCategory>;
    private recipeMethods: BuilderMethodBase<Recipe>;

    constructor(
        @Inject(forwardRef(() => RecipeCategoryService))
        private readonly categoryService: RecipeCategoryService,
        
        @Inject(forwardRef(() => RecipeService))
        private readonly recipeService: RecipeService,
    ){ 
        this.reset();
        this.categoryMethods = new BuilderMethodBase(this.categoryService, this.categoryService.findOneByName.bind(this.categoryService));
        this.recipeMethods = new BuilderMethodBase(this.recipeService, this.recipeService.findOneByName.bind(this.recipeService));
    }

    public reset(): this {
        this.subCategory = new RecipeSubCategory;
        this.taskQueue = [];
        return this;
    }

    public name(name: string): this {
        this.subCategory.name = name;
        return this;
    }

    public parentCategoryById(id: number): this {
        this.taskQueue.push(async () => {
            await this.categoryMethods.entityById(
                (cat) => {this.subCategory.parentCategory = cat; },
                id
            );
        });
        return this;
    }

    public parentCategoryByName(name: string): this {
        this.taskQueue.push(async () => {
            await this.categoryMethods.entityByName(
                (cat) => {this.subCategory.parentCategory = cat; },
                name
            );
        });
        return this;
    }

    public recipesById(ids: number[]): this {
        this.taskQueue.push(async () => {
            await this.recipeMethods.entityByIds(
                (recs) => {this.subCategory.recipes = recs; },
                ids
            );
        });
        return this;
    }

    public async build(): Promise<RecipeSubCategory>{
        for(const task of this.taskQueue){
            await task();
        }
        
        const result = this.subCategory;
        this.reset();
        return result;
    }

    public async buildCreateDto(dto: CreateRecipeSubCategoryDto): Promise<RecipeSubCategory> {
        this.reset();

        if(dto.name){
            this.name(dto.name);
        }
        if(dto.parentCategoryId){
            this.parentCategoryById(dto.parentCategoryId);
        }
        if(dto.recipeIds){
            this.recipesById(dto.recipeIds);
        }

        return await this.build();
    }

    public updateSubCategory(toUpdate: RecipeSubCategory): this {
        this.subCategory = toUpdate;
        return this;
    }

    public async buildUpdateDto(toUpdate: RecipeSubCategory, dto: UpdateRecipeSubCategoryDto): Promise<RecipeSubCategory> {
        this.reset();
        this.updateSubCategory(toUpdate);

        if(dto.name){
            this.name(dto.name);
        }
        if(dto.parentCategoryId){
            this.parentCategoryById(dto.parentCategoryId);
        }
        if(dto.recipeIds){
            this.recipesById(dto.recipeIds);
        }

        return await this.build();
    }
}