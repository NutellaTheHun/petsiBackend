import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { IBuildChildDto } from "../../../base/interfaces/IBuildChildEntity.interface";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { CreateChildRecipeSubCategoryDto } from "../dto/recipe-sub-category/create-child-recipe-sub-category.dto";
import { CreateRecipeSubCategoryDto } from "../dto/recipe-sub-category/create-recipe-sub-category.dto";
import { UpdateChildRecipeSubCategoryDto } from "../dto/recipe-sub-category/update-child-recipe-sub-category.dto copy";
import { UpdateRecipeSubCategoryDto } from "../dto/recipe-sub-category/update-recipe-sub-category.dto";
import { RecipeCategory } from "../entities/recipe-category.entity";
import { RecipeSubCategory } from "../entities/recipe-sub-category.entity";
import { RecipeCategoryService } from "../services/recipe-category.service";
import { RecipeSubCategoryService } from "../services/recipe-sub-category.service";
import { RecipeService } from "../services/recipe.service";
import { RecipeSubCategoryValidator } from "../validators/recipe-sub-category.validator";

@Injectable()
export class RecipeSubCategoryBuilder extends BuilderBase<RecipeSubCategory>
    implements IBuildChildDto<RecipeCategory, RecipeSubCategory> {
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
    ) { super(RecipeSubCategory, 'RecipeSubCategoryBuilder', requestContextService, logger, validator); }

    /**
     * Depreciated, only created as a child through {@link RecipeCategory}.
     */
    protected createEntity(dto: CreateRecipeSubCategoryDto): void {
        if (dto.subCategoryName !== undefined) {
            this.name(dto.subCategoryName);
        }
        if (dto.parentCategoryId !== undefined) {
            this.parentCategoryById(dto.parentCategoryId);
        }
    }

    protected updateEntity(dto: UpdateRecipeSubCategoryDto): void {
        if (dto.subCategoryName !== undefined) {
            this.name(dto.subCategoryName);
        }
    }

    buildChildEntity(dto: CreateChildRecipeSubCategoryDto): void {
        if (dto.subCategoryName !== undefined) {
            this.name(dto.subCategoryName);
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
        for (const dto of dtos) {
            if (dto.mode === 'create') {
                results.push(await this.buildChildCreateDto(parentCategory, dto));
            } else {
                const subCat = await this.subCategoryService.findOne(dto.id);
                if (!subCat) { throw new Error("recipe ingredient not found"); }
                results.push(await this.buildUpdateDto(subCat, dto));
            }
        }
        return results;
    }

    public name(name: string): this {
        return this.setPropByVal('subCategoryName', name);
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