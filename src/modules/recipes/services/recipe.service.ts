import { forwardRef, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { UnitOfMeasureService } from "../../unit-of-measure/services/unit-of-measure.service";
import { CreateRecipeDto } from "../dto/create-recipe.dto";
import { UpdateRecipeDto } from "../dto/update-recipe-dto";
import { Recipe } from "../entities/recipe.entity";
import { RecipeFactory } from "../factories/recipe.factory";
import { RECIPE_CAT_NONE, RECIPE_SUB_CAT_NONE } from "../utils/constants";
import { RecipeCategoryService } from "./recipe-category.service";
import { RecipeIngredientService } from "./recipe-ingredient.service";
import { RecipeSubCategoryService } from "./recipe-sub-category.service";

export class RecipeService extends ServiceBase<Recipe>{
    constructor(
        @InjectRepository(Recipe)
        private readonly recipeRepo: Repository<Recipe>,

        private readonly recipeFactory: RecipeFactory,

        @Inject(forwardRef(() => RecipeCategoryService))
        private readonly categoryService: RecipeCategoryService,

        @Inject(forwardRef(() => RecipeSubCategoryService))
        private readonly subCategoryService: RecipeSubCategoryService,

        @Inject(forwardRef(() => RecipeIngredientService))
        private readonly ingredientService: RecipeIngredientService,

        private readonly measureService: UnitOfMeasureService,

        //private readonly menuItemService: MenuItemService,
    ){ super(recipeRepo); }

    async create(createDto: CreateRecipeDto): Promise<Recipe | null> {

        const exists = await this.findOneByName(createDto.name);
        if(exists) { return null; }

        // const menuItem = await this.menuItemService...

        const ingredients = await this.ingredientService.findEntitiesById(createDto.ingredientIds);
        if(!ingredients){
            throw new Error('list of ingredients is null');
        }

        const batchUnitOfMeasure = await this.measureService.findOne(createDto.batchResultUnitOfMeasureId);
        if(!batchUnitOfMeasure){
            throw new Error("batch unit of measure not found");
        }

        const servivingUnitOfMeasure = await this.measureService.findOne(createDto.servingSizeUnitOfMeasureId);
        if(!servivingUnitOfMeasure){
            throw new Error("serving size unit of measure not found");
        }

        let category;
        if(createDto.categoryId){
            category = await this.categoryService.findOne(createDto.categoryId);
            if(!category){
                throw new Error('category not found');
            }
        } else{
            category = await this.categoryService.findOneByName(RECIPE_CAT_NONE);
        }

        let subCategory;
        if(createDto.subCategoryId){
            subCategory = await this.subCategoryService.findOne(createDto.subCategoryId);
            if(!subCategory){
                throw new Error('sub category not found');
            }
        } else{
            subCategory = await this.subCategoryService.findOneByName(RECIPE_SUB_CAT_NONE);
        }
        
        const recipe = this.recipeFactory.createEntityInstance({
            name: createDto.name,
            //menuItem: ...,
            isIngredient: createDto.isIngredient,
            ingredients: ingredients,
            batchResultQuantity: createDto.batchResultQuantity,
            batchResultUnitOfMeasure: batchUnitOfMeasure,
            servingSizeQuantity: createDto.servingSizeQuantity,
            servingSizeUnitOfMeasure: servivingUnitOfMeasure,
            salesPrice: createDto.salesPrice,
            cost: createDto.salesPrice,
            category: category,
            subCategory: subCategory,
        });

        return await this.recipeRepo.save(recipe);
    }
        
    /**
    * Uses Repository.Save(), not Repository.Update
    */
    async update(id: number, updateDto: UpdateRecipeDto): Promise<Recipe | null> {
        
        const toUpdate = await this.findOne(id);
        if(!toUpdate){ return null; }
        
        if(updateDto.name){
            toUpdate.name = updateDto.name;
        }

        /*
        if(updateDto.menuItemId){
            toUpdate.___ = updateDto.__;
        }
        */

        if(updateDto.isIngredient){
            toUpdate.isIngredient = updateDto.isIngredient;
        }

        if(updateDto.ingredientIds){
            const ingredients = await this.ingredientService.findEntitiesById(updateDto.ingredientIds);
            if(!ingredients){
                throw new Error('list of ingredients is null');
            }
            toUpdate.ingredients = ingredients;
        }

        if(updateDto.batchResultUnitOfMeasureId){
            const batchUnitOfMeasure = await this.measureService.findOne(updateDto.batchResultUnitOfMeasureId);
            if(!batchUnitOfMeasure){
                throw new Error("batch unit of measure not found");
            }
            toUpdate.batchResultUnitOfMeasure = batchUnitOfMeasure;
        }

        if(updateDto.batchResultQuantity){
            toUpdate.batchResultQuantity = updateDto.batchResultQuantity;
        }

        if(updateDto.servingSizeQuantity){
            toUpdate.servingSizeQuantity = updateDto.servingSizeQuantity;
        }

        if(updateDto.servingSizeUnitOfMeasureId){
            const servivingUnitOfMeasure = await this.measureService.findOne(updateDto.servingSizeUnitOfMeasureId);
            if(!servivingUnitOfMeasure){
                throw new Error("serving size unit of measure not found");
            }
            toUpdate.servingSizeUnitOfMeasure = servivingUnitOfMeasure;
        }

        if(updateDto.categoryId){
            const category = await this.categoryService.findOne(updateDto.categoryId);
            if(!category){
                throw new Error('category not found');
            }
            toUpdate.category = category;
        }

        if(updateDto.subCategoryId){
            const subCategory = await this.subCategoryService.findOne(updateDto.subCategoryId);
            if(!subCategory){
                throw new Error('sub category not found');
            }
            toUpdate.subCategory = subCategory;
        }

        if(updateDto.salesPrice){
            toUpdate.salesPrice = updateDto.salesPrice;
        }

        if(updateDto.cost){
            toUpdate.cost = updateDto.cost;
        }

        return await this.recipeRepo.save(toUpdate);
    }

    async findOneByName(name: string, relations?: string[]): Promise<Recipe | null> {
        return this.recipeRepo.findOne({ where: {name: name }, relations});
    }
}