import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { Recipe } from "../entities/recipe.entity";
import { CreateRecipeDto } from "../dto/recipe/create-recipe.dto";
import { UpdateRecipeDto } from "../dto/recipe/update-recipe-dto";
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

    public async validateCreate(dto: CreateRecipeDto): Promise<string | null> {
        // Recipe name already exists
        const exists = await this.repo.findOne({ where: { recipeName: dto.recipeName }});
        if(exists) { 
            return `Recipe with name ${dto.recipeName} already exists`; 
        }

        // Cant assign a subCategory with no category
        if(!dto.categoryId && dto.subCategoryId){
            return 'cannot assign a sub-category with a null category';
        }
        // Cant assign a subCategory that isn't a child to the selected category.
        else if(dto.categoryId && dto.subCategoryId){
            const category = await this.categoryService.findOne(dto.categoryId, ['subCategories']);
            if(!category.subCategories){ throw new Error('subcategories is null'); }

            if(!category.subCategories.find(cat => cat.id === dto.subCategoryId)){
                return 'subcategory must be a child subcategory to the given RecipeCategory';
            }
        }

        //No duplicate recipeIngredients
        if(dto.ingredientDtos){
            const resolvedDtos: {ingredient: string;}[] = []
            for(const d of dto.ingredientDtos){
                if(d.ingredientInventoryItemId){
                    resolvedDtos.push({ingredient: `I:${d.ingredientInventoryItemId}`});
                }
                else if(d.ingredientRecipeId){
                    resolvedDtos.push({ingredient: `R:${d.ingredientRecipeId}`});
                }
            }
            const duplicateIngreds = this.helper.hasDuplicatesByComposite(
                resolvedDtos,
                (ingred) => `${ingred.ingredient}`
            );
            if(duplicateIngreds){
                return 'recipe cannot have duplicate ingredients'
            }
        }   
       
        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateRecipeDto): Promise<string | null> {
        // Recipe name already exists
        if(dto.recipeName){
            const exists = await this.repo.findOne({ where: { recipeName: dto.recipeName }});
            if(exists) { 
                return `Recipe with name ${dto.recipeName} already exists`; 
            }
        }

        // Cant assign a subCategory that isn't a child to the selected category
        if(dto.categoryId && dto.subCategoryId){
            const category = await this.categoryService.findOne(dto.categoryId, ['subCategories']);
            if(!category.subCategories){ throw new Error('subcategories is null'); }

            if(!category.subCategories.find(cat => cat.id === dto.subCategoryId)){
                return 'subcategory must be a child to the given RecipeCategory';
            }
        }
        // Cant assign a subCategory with no category
        else if(!dto.categoryId && dto.subCategoryId){
            const currentCategory = (await this.recipeService.findOne(id, ['category'], ['category.subCategories'])).category;
            if(!currentCategory){ 
                return 'cannot assign a sub-category without an assigned category'
             }
            if(!currentCategory.subCategories){ throw new Error('sub-categories is null'); }

            if(!currentCategory.subCategories.find(cat => cat.id === dto.subCategoryId)){
                return 'subcategory must be a child to the given RecipeCategory';
            }
        }

        //No duplicate recipeIngredients
        if(dto.ingredientDtos){
            const resolvedDtos: {ingredient: string;}[] = []
            for(const d of dto.ingredientDtos){
                    if(d.ingredientInventoryItemId){
                        resolvedDtos.push({ingredient: `I:${d.ingredientInventoryItemId}`});
                    }
                    else if(d.ingredientRecipeId){
                        resolvedDtos.push({ingredient: `R:${d.ingredientRecipeId}`});
                    }
            }
            const duplicateIngreds = this.helper.hasDuplicatesByComposite(
                resolvedDtos,
                (ingred) => `${ingred.ingredient}`
            );
            if(duplicateIngreds){
                return 'recipe cannot have duplicate ingredients'
            }
        }
        return null;
    }
}