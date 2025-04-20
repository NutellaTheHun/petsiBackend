import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { CreateRecipeCategoryDto } from "../dto/create-recipe-category.dto";
import { UpdateRecipeCategoryDto } from "../dto/update-recipe-category.dto";
import { RecipeCategory } from "../entities/recipe-category.entity";
import { RecipeSubCategoryService } from "../services/recipe-sub-category.service";
import { RecipeService } from "../services/recipe.service";

@Injectable()
export class RecipeCategoryBuilder extends BuilderBase<RecipeCategory>{
    constructor(
        @Inject(forwardRef(() => RecipeService))
        private readonly subCategoryService: RecipeSubCategoryService,
        
        @Inject(forwardRef(() => RecipeSubCategoryService))
        private readonly recipeService: RecipeService,
    ){ super(RecipeCategory); }

    public name(name: string): this {
        return this.setProp('name', name);
    }

    public subCategoriesById(ids: number[]): this {
        return this.setPropsByIds(this.subCategoryService.findEntitiesById.bind(this.subCategoryService), 'subCategories', ids);
    }

    public recipesById(ids: number[]): this {
        return this.setPropsByIds(this.recipeService.findEntitiesById.bind(this.recipeService), 'recipes', ids);
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

    public async buildUpdateDto(toUpdate: RecipeCategory, dto: UpdateRecipeCategoryDto): Promise<RecipeCategory> {
        this.reset();
        this.updateEntity(toUpdate);

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