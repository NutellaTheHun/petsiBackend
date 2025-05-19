import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { RequestContextService } from "../../request-context/RequestContextService";
import { CreateChildRecipeSubCategoryDto } from "../dto/recipe-sub-category/create-child-recipe-sub-category.dto";
import { CreateRecipeCategoryDto } from "../dto/recipe-category/create-recipe-category.dto";
import { UpdateChildRecipeSubCategoryDto } from "../dto/recipe-sub-category/update-child-recipe-sub-category.dto copy";
import { UpdateRecipeCategoryDto } from "../dto/recipe-category/update-recipe-category.dto";
import { RecipeCategory } from "../entities/recipe-category.entity";
import { RecipeSubCategoryService } from "../services/recipe-sub-category.service";
import { RecipeService } from "../services/recipe.service";
import { RecipeCategoryValidator } from "../validators/recipe-category.validator";
import { RecipeSubCategoryBuilder } from "./recipe-sub-category.builder";
import { AppLogger } from "../../app-logging/app-logger";

@Injectable()
export class RecipeCategoryBuilder extends BuilderBase<RecipeCategory>{
    constructor(
        @Inject(forwardRef(() => RecipeSubCategoryService))
        private readonly recipeService: RecipeService,

        @Inject(forwardRef(() => RecipeSubCategoryBuilder))
        private readonly subCategoryBuilder: RecipeSubCategoryBuilder,

        validator: RecipeCategoryValidator,
        requestContextService: RequestContextService,
        logger: AppLogger,
    ){ super(RecipeCategory, 'RecipeCategoryBuilder', requestContextService, logger, validator); }

    protected createEntity(dto: CreateRecipeCategoryDto): void {
        if(dto.categoryName){
            this.name(dto.categoryName);
        }
        if(dto.subCategoryDtos){
            this.subCategoriesByBuilder(dto.subCategoryDtos);
        }
    }

    protected updateEntity(dto: UpdateRecipeCategoryDto): void {
        if(dto.categoryName){
            this.name(dto.categoryName);
        }
        if(dto.subCategoryDtos){
            this.subCategoriesByBuilder(dto.subCategoryDtos);
        }
    }

    public name(name: string): this {
        return this.setPropByVal('categoryName', name);
    }

    public subCategoriesByBuilder(dtos: (CreateChildRecipeSubCategoryDto | UpdateChildRecipeSubCategoryDto)[]): this {
        return this.setPropByBuilder(this.subCategoryBuilder.buildManyDto.bind(this.subCategoryBuilder), 'subCategories', this.entity, dtos);
    }

    public recipesById(ids: number[]): this {
        return this.setPropsByIds(this.recipeService.findEntitiesById.bind(this.recipeService), 'recipes', ids);
    }
}