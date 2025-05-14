import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { IBuildChildDto } from "../../../base/interfaces/IBuildChildEntity.interface";
import { RequestContextService } from "../../request-context/RequestContextService";
import { AppLogger } from "../../app-logging/app-logger";
import { CreateChildRecipeSubCategoryDto } from "../dto/create-child-recipe-sub-category.dto";
import { CreateRecipeSubCategoryDto } from "../dto/create-recipe-sub-category.dto";
import { UpdateChildRecipeSubCategoryDto } from "../dto/update-child-recipe-sub-category.dto copy";
import { UpdateRecipeSubCategoryDto } from "../dto/update-recipe-sub-category.dto";
import { RecipeCategory } from "../entities/recipe-category.entity";
import { RecipeSubCategory } from "../entities/recipe-sub-category.entity";
import { RecipeCategoryService } from "../services/recipe-category.service";
import { RecipeSubCategoryService } from "../services/recipe-sub-category.service";
import { RecipeService } from "../services/recipe.service";
import { RecipeSubCategoryValidator } from "../validators/recipe-sub-category.validator";

@Injectable()
export class RecipeSubCategoryBuilder extends BuilderBase<RecipeSubCategory>
implements IBuildChildDto<RecipeCategory, RecipeSubCategory>{
    constructor(
        @Inject(forwardRef(() => RecipeCategoryService))
        private readonly categoryService: RecipeCategoryService,

        @Inject(forwardRef(() => RecipeSubCategoryService))
        private readonly subCategoryService: RecipeSubCategoryService,
        
        @Inject(forwardRef(() => RecipeService))
        private readonly recipeService: RecipeService,
        validator: RecipeSubCategoryValidator,
        requestContextService: RequestContextService,
        logger: AppLogger,
    ){ super(RecipeSubCategory, 'RecipeSubCategoryBuilder', requestContextService, logger, validator); }

    protected createEntity(dto: CreateRecipeSubCategoryDto): void {
        if(dto.name){
            this.name(dto.name);
        }
        if(dto.parentCategoryId){
            this.parentCategoryById(dto.parentCategoryId);
        }
    }
    
    protected updateEntity(dto: UpdateRecipeSubCategoryDto): void {
        if(dto.name){
            this.name(dto.name);
        }
        if(dto.parentCategoryId){
            this.parentCategoryById(dto.parentCategoryId);
        }
    }

    buildChildEntity(dto: CreateChildRecipeSubCategoryDto): void {
        if(dto.name){
            this.name(dto.name);
        }
    }

    async buildChildCreateDto(parent: RecipeCategory, dto: any): Promise<RecipeSubCategory> {
        await this.validateCreateDto(dto);

        this.reset();

        this.entity.parentCategory = parent;

        this.buildChildEntity(dto);

        return await this.build();
    }

    public async buildManyDto(parentCategory: RecipeCategory, dtos: (CreateChildRecipeSubCategoryDto | UpdateChildRecipeSubCategoryDto)[]): Promise<RecipeSubCategory[]> {
        const results: RecipeSubCategory[] = [];
        for(const dto of dtos){
            if(dto.mode === 'create'){
                results.push( await this.buildChildCreateDto(parentCategory, dto));
            } else {
                const subCat = await this.subCategoryService.findOne(dto.id);
                if(!subCat){ throw new Error("recipe ingredient not found"); }
                results.push( await this.buildUpdateDto(subCat, dto));
            }
        }
        return results;
    }
    
    public name(name: string): this {
        return this.setPropByVal('name', name);
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
}