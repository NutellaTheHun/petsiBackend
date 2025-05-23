import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { ValidationError } from "../../../util/exceptions/validationError";
import { CreateRecipeDto } from "../dto/recipe/create-recipe.dto";
import { UpdateRecipeDto } from "../dto/recipe/update-recipe-dto";
import { Recipe } from "../entities/recipe.entity";
import { RecipeCategoryService } from "../services/recipe-category.service";
import { RecipeService } from "../services/recipe.service";

@Injectable()
export class RecipeValidator extends ValidatorBase<Recipe> {
    constructor(
        @InjectRepository(Recipe)
        private readonly repo: Repository<Recipe>,

        @Inject(forwardRef(() => RecipeService))
        private readonly recipeService: RecipeService,
        
        @Inject(forwardRef(() => RecipeCategoryService))
        private readonly categoryService: RecipeCategoryService,
    ){ super(repo); }

    public async validateCreate(dto: CreateRecipeDto): Promise<ValidationError[]> {

        // Exists
        if(await this.helper.exists(this.repo, 'recipeName', dto.recipeName)) { 
            this.addError({
                error: 'Recipe already exists.',
                status: 'EXIST',
                contextEntity: 'CreateRecipeDto',
                sourceEntity: 'Recipe',
                value: dto.recipeName,
            } as ValidationError);
        }

        // subcategory if category isnt assigned
        if(!dto.categoryId && dto.subCategoryId){
            this.addError({
                error: 'Cannot assign a subcategory without a category',
                status: 'INVALID',
                contextEntity: 'CreateRecipeDto',
                sourceEntity: 'RecipeSubCategory',
                sourceId: dto.subCategoryId,
            } as ValidationError);
        }

        // Validate category / subcategory
        else if(dto.categoryId && dto.subCategoryId){
            const category = await this.categoryService.findOne(dto.categoryId, ['subCategories']);
            if(!category.subCategories){ throw new Error('subcategories is null'); }

            if(!category.subCategories.find(cat => cat.id === dto.subCategoryId)){
                this.addError({
                    error: 'Invalid category / subcategory',
                    status: 'INVALID',
                    contextEntity: 'CreateRecipeDto',
                    sourceEntity: 'RecipeSubCategory',
                    sourceId: dto.subCategoryId,
                    conflictEntity: 'RecipeCategory',
                    conflictId: dto.categoryId,
                } as ValidationError);
            }
        }

        //No duplicate recipeIngredients
        if(dto.ingredientDtos){
            const resolvedDtos: string[] = []
            for(const d of dto.ingredientDtos){
                if(d.ingredientInventoryItemId){
                    resolvedDtos.push(`I:${d.ingredientInventoryItemId}`);
                }
                else if(d.ingredientRecipeId){
                    resolvedDtos.push(`R:${d.ingredientRecipeId}`);
                }
            }
            const duplicateIngreds = this.helper.findDuplicates(
                resolvedDtos,
                (ingred) => `${ingred}`
            );
            if(duplicateIngreds){
                for(const dup of duplicateIngreds){
                    const [prefix, idStr] = dup.split(':');
                    const ingredId = parseInt(idStr, 10);
                    const entity = prefix === 'I' ? 'InventoryItem' : 'Recipe';

                    this.addError({
                        error: 'Duplicate ingredients',
                        status: 'DUPLICATE',
                        contextEntity: 'CreateRecipeDto',
                        sourceEntity: entity,
                        sourceId: ingredId,
                    } as ValidationError);
                }
            }
        }   
       
        return this.errors;
    }
    
    public async validateUpdate(id: number, dto: UpdateRecipeDto): Promise<ValidationError[]> {
        
        // Exists
        if(dto.recipeName){
            if(await this.helper.exists(this.repo, 'recipeName', dto.recipeName)) { 
                this.addError({
                    error: 'Recipe already exists.',
                    status: 'EXIST',
                    contextEntity: 'UpdateRecipeDto',
                    contextId: id,
                    sourceEntity: 'Recipe',
                    value: dto.recipeName,
                } as ValidationError);
            }
        }
        
        // Validate category / subcategory
        if(dto.categoryId && dto.subCategoryId){

            const category = await this.categoryService.findOne(dto.categoryId, ['subCategories']);
            if(!category.subCategories){ throw new Error('subcategories is null'); }

            // category / subcategory
            if(!category.subCategories.find(cat => cat.id === dto.subCategoryId)){
                this.addError({
                    error: 'Invalid category / subcategory',
                    status: 'INVALID',
                    contextEntity: 'UpdateRecipeDto',
                    contextId: id,
                    sourceEntity: 'RecipeSubCategory',
                    sourceId: dto.subCategoryId,
                    conflictEntity: 'RecipeCategory',
                    conflictId: dto.categoryId,
                } as ValidationError);
            }
        }
        else if(!dto.categoryId && dto.subCategoryId){
            const currentCategory = (await this.recipeService.findOne(id, ['category'], ['category.subCategories'])).category;
            if(!currentCategory){ throw new Error(); }

            // null category / subcategory
            if(!currentCategory){
                this.addError({
                    error: 'Cannot assign a subcategory without an assigned category',
                    status: 'INVALID',
                    contextEntity: 'UpdateRecipeDto',
                    contextId: id,
                    sourceEntity: 'RecipeSubCategory',
                    sourceId: dto.subCategoryId,
                } as ValidationError);
            }

            // category / subcategory
            if(!currentCategory.subCategories.find(cat => cat.id === dto.subCategoryId)){
                this.addError({
                    error: 'Invalid category / subcategory',
                    status: 'INVALID',
                    contextEntity: 'UpdateRecipeDto',
                    contextId: id,
                    sourceEntity: 'RecipeSubCategory',
                    sourceId: dto.subCategoryId,
                    conflictEntity: 'RecipeCategory',
                    conflictId: currentCategory.id,
                } as ValidationError);
            }
        }

        
        if(dto.ingredientDtos){
            // resolve
            const resolvedDtos: string[] = []
            const resolvedIds: number[] = [];
            for(const d of dto.ingredientDtos){
                if(d.ingredientInventoryItemId){
                    resolvedDtos.push(`I:${d.ingredientInventoryItemId}`);
                }
                else if(d.ingredientRecipeId){
                    resolvedDtos.push(`R:${d.ingredientRecipeId}`);
                    
                }
                if(d.mode === 'update'){
                    resolvedIds.push(d.id);
                }
            }

            // No duplicate recipeIngredients
            const duplicateIngreds = this.helper.findDuplicates(
                resolvedDtos,
                (ingred) => `${ingred}`
            );
            if(duplicateIngreds){
                for(const dup of duplicateIngreds){
                    const [prefix, idStr] = dup.split(':');
                    const ingredId = parseInt(idStr, 10);
                    const entity = prefix === 'I' ? 'InventoryItem' : 'Recipe';

                    this.addError({
                        error: 'Duplicate ingredients',
                        status: 'DUPLICATE',
                        contextEntity: 'UpdateRecipeDto',
                        contextId: id,
                        sourceEntity: entity,
                        sourceId: ingredId,
                    } as ValidationError);
                }
            }

            // No duplicate ingredient updates
            const duplicateIds = this.helper.findDuplicates(
                resolvedIds,
                (id) => `${id}`
            );
            if(duplicateIds){
                for(const dupId of duplicateIds){
                    this.addError({
                            error: 'Multiple update requests for the same ingredient',
                            status: 'DUPLICATE',
                            contextEntity: 'UpdateRecipeDto',
                            contextId: id,
                            sourceEntity: 'RecipeIngredient',
                            sourceId: dupId,
                    } as ValidationError);
                }
            }
        }

        return this.errors;
    }
}