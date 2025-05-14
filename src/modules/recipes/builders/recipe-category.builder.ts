import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { RequestContextService } from "../../request-context/RequestContextService";
import { CreateChildRecipeSubCategoryDto } from "../dto/create-child-recipe-sub-category.dto";
import { CreateRecipeCategoryDto } from "../dto/create-recipe-category.dto";
import { UpdateChildRecipeSubCategoryDto } from "../dto/update-child-recipe-sub-category.dto copy";
import { UpdateRecipeCategoryDto } from "../dto/update-recipe-category.dto";
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
        if(dto.name){
            this.name(dto.name);
        }
        if(dto.subCategoryDtos){
            this.subCategoriesByBuilder(dto.subCategoryDtos);
        }
    }

    protected updateEntity(dto: UpdateRecipeCategoryDto): void {
        if(dto.name){
            this.name(dto.name);
        }
        if(dto.subCategoryDtos){
            this.subCategoriesByBuilder(dto.subCategoryDtos);
        }
    }

    public name(name: string): this {
        return this.setPropByVal('name', name);
    }

    public subCategoriesByBuilder(dtos: (CreateChildRecipeSubCategoryDto | UpdateChildRecipeSubCategoryDto)[]): this {
        return this.setPropByBuilder(this.subCategoryBuilder.buildManyDto.bind(this.subCategoryBuilder), 'subCategories', this.entity, dtos);
    }

    public recipesById(ids: number[]): this {
        return this.setPropsByIds(this.recipeService.findEntitiesById.bind(this.recipeService), 'recipes', ids);
    }
}