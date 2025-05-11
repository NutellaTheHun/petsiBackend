import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { CreateRecipeSubCategoryDto } from "../dto/create-recipe-sub-category.dto";
import { UpdateRecipeSubCategoryDto } from "../dto/update-recipe-sub-category.dto";
import { RecipeSubCategory } from "../entities/recipe-sub-category.entity";
import { RecipeCategoryService } from "../services/recipe-category.service";
import { RecipeService } from "../services/recipe.service";
import { RecipeSubCategoryValidator } from "../validators/recipe-sub-category.validator";

@Injectable()
export class RecipeSubCategoryBuilder extends BuilderBase<RecipeSubCategory>{
    constructor(
        @Inject(forwardRef(() => RecipeCategoryService))
        private readonly categoryService: RecipeCategoryService,
        
        @Inject(forwardRef(() => RecipeService))
        private readonly recipeService: RecipeService,
        validator: RecipeSubCategoryValidator,
    ){ super(RecipeSubCategory, validator); }

    protected async createEntity(dto: CreateRecipeSubCategoryDto): Promise<void> {
        if(dto.name){
            this.name(dto.name);
        }
        if(dto.parentCategoryId){
            this.parentCategoryById(dto.parentCategoryId);
        }
        if(dto.recipeIds){
            this.recipesById(dto.recipeIds);
        }
    }
    
    protected async updateEntity(dto: UpdateRecipeSubCategoryDto): Promise<void> {
        if(dto.name){
            this.name(dto.name);
        }
        if(dto.parentCategoryId){
            this.parentCategoryById(dto.parentCategoryId);
        }
        if(dto.recipeIds){
            this.recipesById(dto.recipeIds);
        }
    }

    public name(name: string): this {
        return this.setProp('name', name);
    }

    public parentCategoryById(id: number): this {
        return this.setPropById(this.categoryService.findOne.bind(this.categoryService), 'parentCategory', id);
    }

    public parentCategoryByName(name: string): this {
        return this.setPropByName(this.categoryService.findOneByName.bind(this.categoryService), 'parentCategory', name);
    }

    public recipesById(ids: number[]): this {
        return this.setPropsByIds(this.recipeService.findEntitiesById.bind(this.recipeService), 'recipes', ids);
    }

    /*public async buildCreateDto(dto: CreateRecipeSubCategoryDto): Promise<RecipeSubCategory> {
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
    }*/

    /*public async buildUpdateDto(toUpdate: RecipeSubCategory, dto: UpdateRecipeSubCategoryDto): Promise<RecipeSubCategory> {
        this.reset();
        this.setEntity(toUpdate);

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
    }*/
}