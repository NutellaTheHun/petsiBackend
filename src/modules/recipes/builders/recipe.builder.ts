import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { Recipe } from "../entities/recipe.entity";
import { MenuItemsService } from "../../menu-items/menu-items.service";
import { RecipeIngredientService } from "../services/recipe-ingredient.service";
import { UnitOfMeasureService } from "../../unit-of-measure/services/unit-of-measure.service";
import { RecipeCategoryService } from "../services/recipe-category.service";
import { RecipeSubCategoryService } from "../services/recipe-sub-category.service";
import { BuilderMethodBase } from "../../../base/builder-method-base";
import { MenuItem } from "../../menu-items/entities/menu-item.entity";
import { RecipeIngredient } from "../entities/recipe-ingredient.entity";
import { UnitOfMeasure } from "../../unit-of-measure/entities/unit-of-measure.entity";
import { RecipeCategory } from "../entities/recipe-category.entity";
import { RecipeSubCategory } from "../entities/recipe-sub-category.entity";
import { CreateRecipeDto } from "../dto/create-recipe.dto";
import { UpdateRecipeDto } from "../dto/update-recipe-dto";

@Injectable()
export class RecipeBuilder {
    private recipe: Recipe;
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
        this.measureMethods = new BuilderMethodBase(this.measureService, this.measureService.findOneByName.bind(this.measureService));
        this.categoryMethods = new BuilderMethodBase(this.categoryService, this.categoryService.findOneByName.bind(this.categoryService));
        this.subCategoryMethods = new BuilderMethodBase(this.subCategoryService, this.subCategoryService.findOneByName.bind(this.subCategoryService));
    }

    public reset(): this {
        this.recipe = new Recipe;
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

    public async ingredientsById(ids: number[]): Promise<this> {
        await this.ingredientMethods.entityByIds(
            (ingreds) => { this.recipe.ingredients = ingreds; },
            ids,
        )
        return this;
    }

    public batchResultQuantity(amount: number): this {
        this.recipe.batchResultQuantity = amount;
        return this;
    }

    public async batchResultUnitOfMeasureById(id: number): Promise<this> {
        await this.measureMethods.entityById(
            (unit) => { this.recipe.batchResultUnitOfMeasure = unit; },
            id,
        );
        return this;
    }

    public async batchResultUnitOfMeasureByName(name: string): Promise<this> {
        await this.measureMethods.entityByName(
            (unit) => { this.recipe.batchResultUnitOfMeasure = unit; },
            name,
        );
        return this;
    }

    public servingSizeQuantity(amount: number): this {
        this.recipe.servingSizeQuantity = amount;
        return this;
    }

    public async servingUnitOfMeasureById(id: number): Promise<this> {
        await this.measureMethods.entityById(
            (unit) => { this.recipe.servingSizeUnitOfMeasure = unit; },
            id,
        );
        return this;
    }

    public async servingUnitOfMeasureByName(name: string): Promise<this> {
        await this.measureMethods.entityByName(
            (unit) => { this.recipe.servingSizeUnitOfMeasure = unit; },
            name,
        );
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

    public async categoryById(id: number): Promise<this> {
        await this.categoryMethods.entityById(
            (cat) => { this.recipe.category = cat; },
            id,
        );
        return this;
    }

    public async categoryByName(name: string): Promise<this> {
        await this.categoryMethods.entityByName(
            (cat) => { this.recipe.category = cat; },
            name,
        );
        return this;
    }

    public async subCategoryById(id: number): Promise<this> {
        await this.subCategoryMethods.entityById(
            (cat) => { this.recipe.subCategory = cat; },
            id,
        );
        return this;
    }

    public async subCategoryByName(name: string): Promise<this> {
        await this.subCategoryMethods.entityByName(
            (cat) => { this.recipe.subCategory = cat; },
            name,
        );
        return this;
    }

    public getRecipe(): Recipe {
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
            await this.batchResultUnitOfMeasureById(dto.batchResultUnitOfMeasureId);
        }
        if(dto.categoryId){
            await this.categoryById(dto.categoryId);
        }
        if(dto.cost){
            this.cost(dto.cost);
        }
        if(dto.ingredientIds){ 
            await this.ingredientsById(dto.ingredientIds);
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
            await this.servingUnitOfMeasureById(dto.servingSizeUnitOfMeasureId);
        }
        if(dto.subCategoryId){
            await this.subCategoryById(dto.subCategoryId);
        }

        return this.getRecipe();
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
            await this.batchResultUnitOfMeasureById(dto.batchResultUnitOfMeasureId);
        }
        if(dto.categoryId){
            await this.categoryById(dto.categoryId);
        }
        if(dto.cost){
            this.cost(dto.cost);
        }
        if(dto.ingredientIds){ 
            await this.ingredientsById(dto.ingredientIds);
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
            await this.servingUnitOfMeasureById(dto.servingSizeUnitOfMeasureId);
        }
        if(dto.subCategoryId){
            await this.subCategoryById(dto.subCategoryId);
        }

        return this.getRecipe();
    }
}