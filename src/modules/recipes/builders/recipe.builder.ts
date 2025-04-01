import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { Recipe } from "../entities/recipe.entity";
import { RecipeIngredientService } from "../services/recipe-ingredient.service";
import { UnitOfMeasureService } from "../../unit-of-measure/services/unit-of-measure.service";
import { RecipeCategoryService } from "../services/recipe-category.service";
import { RecipeSubCategoryService } from "../services/recipe-sub-category.service";
import { BuilderMethodBase } from "../../../base/builder-method-base";
import { RecipeIngredient } from "../entities/recipe-ingredient.entity";
import { UnitOfMeasure } from "../../unit-of-measure/entities/unit-of-measure.entity";
import { RecipeCategory } from "../entities/recipe-category.entity";
import { RecipeSubCategory } from "../entities/recipe-sub-category.entity";
import { CreateRecipeDto } from "../dto/create-recipe.dto";
import { UpdateRecipeDto } from "../dto/update-recipe-dto";
import { REC_CAT_NONE, REC_SUBCAT_NONE } from "../utils/constants";

@Injectable()
export class RecipeBuilder {
    private recipe: Recipe;
    private taskQueue: (() => Promise<void>)[]; // Queue for async tasks

    //private menuItemMethods: BuilderMethodBase<MenuItem>;
    private ingredientMethods: BuilderMethodBase<RecipeIngredient>;
    private measureMethods: BuilderMethodBase<UnitOfMeasure>;
    private categoryMethods: BuilderMethodBase<RecipeCategory>;
    private subCategoryMethods: BuilderMethodBase<RecipeSubCategory>;
    
    constructor(
        //private readonly menuItemService: MenuItemsService,
        @Inject(forwardRef(() => RecipeIngredientService))
        private readonly ingredientService: RecipeIngredientService,
        
        @Inject(forwardRef(() => RecipeCategoryService))
        private readonly categoryService: RecipeCategoryService,
        
        @Inject(forwardRef(() => RecipeSubCategoryService))
        private readonly subCategoryService: RecipeSubCategoryService,

        private readonly measureService: UnitOfMeasureService,
    ){ 
        this.reset(); 
        //this.menuItemMethods = new BuilderMethodBase(this.menuItemService, );
        this.ingredientMethods = new BuilderMethodBase(this.ingredientService, );
        this.measureMethods = new BuilderMethodBase(
            this.measureService, 
            this.measureService.findOneByName.bind(this.measureService));
        this.categoryMethods = new BuilderMethodBase(
            this.categoryService, 
            this.categoryService.findOneByName.bind(this.categoryService));
        this.subCategoryMethods = new BuilderMethodBase(
            this.subCategoryService, 
            this.subCategoryService.findOneByName.bind(this.subCategoryService));
    }

    public reset(): this {
        this.recipe = new Recipe;
        this.taskQueue = [];
        return this
    }

    public name(name: string): this {
        this.recipe.name = name;
        return this;
    }
    /*
    public menuItemById(id: number): this {
        const item = await this.menuItemService.findOne(id);
        if(!item){ throw new Error("menu item not found"); }

        this.recipe.menuItem = item;
        return this;
    }

    public menuItemByName(name: string): this {
        const item = await this.menuItemService.findOneByName(name);
        if(!item){ throw new Error("menu item not found"); }

        this.recipe.menuItem = item;
        return this;
    }*/

    public isIngredient(value: boolean): this {
        this.recipe.isIngredient = value;
        return this;
    }

    public ingredientsById(ids: number[]): this {
        this.taskQueue.push(async () => {
            await this.ingredientMethods.entityByIds(
                (ingreds) => { this.recipe.ingredients = ingreds; },
                ids,
            );
        });
        return this;
    }

    public batchResultQuantity(amount: number): this {
        this.recipe.batchResultQuantity = amount;
        return this;
    }

    public batchResultUnitOfMeasureById(id: number): this {
        this.taskQueue.push(async () => {
            await this.measureMethods.entityById(
                (unit) => { this.recipe.batchResultUnitOfMeasure = unit; },
                id,
            );
        });
        
        return this;
    }

    public batchResultUnitOfMeasureByName(name: string): this {
        this.taskQueue.push(async () => {
            await this.measureMethods.entityByName(
                (unit) => { this.recipe.batchResultUnitOfMeasure = unit; },
                name,
            );
        });
        
        return this;
    }

    public servingSizeQuantity(amount: number): this {
        this.recipe.servingSizeQuantity = amount;
        return this;
    }

    public servingUnitOfMeasureById(id: number): this {
        this.taskQueue.push(async () => {
            await this.measureMethods.entityById(
                (unit) => { this.recipe.servingSizeUnitOfMeasure = unit; },
                id,
            );
        });
        return this;
    }

    public servingUnitOfMeasureByName(name: string): this {
        this.taskQueue.push(async () => {
            await this.measureMethods.entityByName(
                (unit) => { this.recipe.servingSizeUnitOfMeasure = unit; },
                name,
            );
        });
        
        return this;
    }

    public salesPrice(amount: number): this {
        this.recipe.salesPrice = amount;
        return this;
    }

    public cost(amount: number): this {
        this.recipe.cost = amount;
        return this;
    }

    public categoryById(id: number): this {
        this.taskQueue.push(async () => {
            await this.categoryMethods.entityById(
                (cat) => { this.recipe.category = cat; },
                id,
            );
        });
        return this;
    }

    public categoryByName(name: string): this {
        this.taskQueue.push(async () => {
            await this.categoryMethods.entityByName(
                (cat) => { this.recipe.category = cat; },
                name,
            );
        });
        return this;
    }

    public subCategoryById(id: number): this {
        this.taskQueue.push(async () => {
            await this.subCategoryMethods.entityById(
                (cat) => { this.recipe.subCategory = cat; },
                id,
            );
        });
        return this;
    }

    public subCategoryByName(name: string): this {
        this.taskQueue.push(async () => {
            await this.subCategoryMethods.entityByName(
                (cat) => { this.recipe.subCategory = cat; },
                name,
            );
        });
        return this;
    }

    public async build(): Promise<Recipe> {
        for (const task of this.taskQueue) {
            await task();
        }

        const result = this.recipe;
        this.reset();
        return result;
    }

    public async buildCreateDto(dto: CreateRecipeDto): Promise<Recipe> {
        this.reset();

        if(dto.batchResultQuantity){
            this.batchResultQuantity(dto.batchResultQuantity);
        }
        if(dto.batchResultUnitOfMeasureId){
            this.batchResultUnitOfMeasureById(dto.batchResultUnitOfMeasureId);
        }
        if(dto.categoryId){
            this.categoryById(dto.categoryId);
        }
        else{
            const defaultCategory = await this.categoryService.findOneByName(REC_CAT_NONE);
            if(!defaultCategory){ throw new Error("default category (NO CATEGORY) is null"); }
            this.categoryById(defaultCategory.id);
        }
        if(dto.cost){
            this.cost(dto.cost);
        }
        if(dto.ingredientIds){ 
            this.ingredientsById(dto.ingredientIds);
        }
        if(dto.isIngredient){
            this.isIngredient(dto.isIngredient);
        }
        if(dto.menuItemId){
            // await this.menuItemById(dto.menuItemId);
        }
        if(dto.name){
            this.name(dto.name);
        }
        if(dto.salesPrice){
            this.salesPrice(dto.salesPrice);
        }
        if(dto.servingSizeQuantity){
            this.servingSizeQuantity(dto.servingSizeQuantity);
        }
        if(dto.servingSizeUnitOfMeasureId){
            this.servingUnitOfMeasureById(dto.servingSizeUnitOfMeasureId);
        }
        if(dto.subCategoryId){
            this.subCategoryById(dto.subCategoryId);
        }else{
            const defaultCategory = await this.subCategoryService.findOneByName(REC_SUBCAT_NONE);
            if(!defaultCategory){ throw new Error("default sub-category (NO CATEGORY) is null"); }
            this.subCategoryById(defaultCategory.id);
        }

        return await this.build();
    }

    public updateRecipe(toUpdate: Recipe): this{
        this.recipe = toUpdate;
        return this;
    }

    public async buildUpdateDto(toUpdate: Recipe, dto: UpdateRecipeDto): Promise<Recipe> {
        this.reset();
        this.updateRecipe(toUpdate);

        if(dto.batchResultQuantity){
            this.batchResultQuantity(dto.batchResultQuantity);
        }
        if(dto.batchResultUnitOfMeasureId){
            this.batchResultUnitOfMeasureById(dto.batchResultUnitOfMeasureId);
        }
        if(dto.categoryId){
            this.categoryById(dto.categoryId);
        }
        if(dto.cost){
            this.cost(dto.cost);
        }
        if(dto.ingredientIds){ 
            this.ingredientsById(dto.ingredientIds);
        }
        if(dto.isIngredient){
            this.isIngredient(dto.isIngredient);
        }
        if(dto.menuItemId){
            // await this.menuItemById(dto.menuItemId);
        }
        if(dto.name){
            this.name(dto.name);
        }
        if(dto.salesPrice){
            this.salesPrice(dto.salesPrice);
        }
        if(dto.servingSizeQuantity){
            this.servingSizeQuantity(dto.servingSizeQuantity);
        }
        if(dto.servingSizeUnitOfMeasureId){
            this.servingUnitOfMeasureById(dto.servingSizeUnitOfMeasureId);
        }
        if(dto.subCategoryId){
            this.subCategoryById(dto.subCategoryId);
        }

        return await this.build();
    }
}