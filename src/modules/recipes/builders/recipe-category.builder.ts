import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { CreateRecipeCategoryDto } from "../dto/create-recipe-category.dto";
import { UpdateRecipeCategoryDto } from "../dto/update-recipe-category.dto";
import { RecipeCategory } from "../entities/recipe-category.entity";
import { RecipeSubCategoryService } from "../services/recipe-sub-category.service";
import { RecipeService } from "../services/recipe.service";
import { RecipeCategoryValidator } from "../validators/recipe-category.validator";

@Injectable()
export class RecipeCategoryBuilder extends BuilderBase<RecipeCategory>{
    constructor(
        @Inject(forwardRef(() => RecipeService))
        private readonly subCategoryService: RecipeSubCategoryService,
        
        @Inject(forwardRef(() => RecipeSubCategoryService))
        private readonly recipeService: RecipeService,

        validator: RecipeCategoryValidator,
    ){ super(RecipeCategory, validator); }

    protected async createEntity(dto: CreateRecipeCategoryDto): Promise<void> {
        if(dto.name){
            this.name(dto.name);
        }
    }

    protected async updateEntity(dto: UpdateRecipeCategoryDto): Promise<void> {
        if(dto.name){
            this.name(dto.name);
        }
        if(dto.recipeIds){
            this.recipesById(dto.recipeIds);
        }
        if(dto.subCategoryIds){
            this.subCategoriesById(dto.subCategoryIds);
        }
    }

    public name(name: string): this {
        return this.setProp('name', name);
    }

    public subCategoriesById(ids: number[]): this {
        return this.setPropsByIds(this.subCategoryService.findEntitiesById.bind(this.subCategoryService), 'subCategories', ids);
    }

    public recipesById(ids: number[]): this {
        return this.setPropsByIds(this.recipeService.findEntitiesById.bind(this.recipeService), 'recipes', ids);
    }
}