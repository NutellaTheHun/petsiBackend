import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { UnitOfMeasureService } from "../../unit-of-measure/services/unit-of-measure.service";
import { CreateRecipeDto } from "../dto/create-recipe.dto";
import { UpdateRecipeDto } from "../dto/update-recipe-dto";
import { Recipe } from "../entities/recipe.entity";
import { RecipeCategoryService } from "../services/recipe-category.service";
import { RecipeIngredientService } from "../services/recipe-ingredient.service";
import { RecipeSubCategoryService } from "../services/recipe-sub-category.service";
import { REC_CAT_NONE, REC_SUBCAT_NONE } from "../utils/constants";

@Injectable()
export class RecipeBuilder extends BuilderBase<Recipe>{
    constructor(
        //private readonly menuItemService: MenuItemsService,
        @Inject(forwardRef(() => RecipeIngredientService))
        private readonly ingredientService: RecipeIngredientService,
        
        @Inject(forwardRef(() => RecipeCategoryService))
        private readonly categoryService: RecipeCategoryService,
        
        @Inject(forwardRef(() => RecipeSubCategoryService))
        private readonly subCategoryService: RecipeSubCategoryService,

        private readonly unitService: UnitOfMeasureService,
    ){ super(Recipe); }

    public name(name: string): this {
        return this.setProp('name', name);
    }
    /*
    public menuItemById(id: number): this {
        return this.setPropById(this.menuItemService.findOne.bind(this.menuItemService), ,id);
    }

    public menuItemByName(name: string): this {
        return this.setPropByName(this.menuItemService.findOneByName.bind(this.menuItemService), ,name);
    }*/

    public isIngredient(value: boolean): this {
        return this.setProp('isIngredient', value);
    }

    public ingredientsById(ids: number[]): this {
        return this.setPropsByIds(this.ingredientService.findEntitiesById.bind(this.ingredientService), 'ingredients', ids);
    }

    public batchResultQuantity(amount: number): this {
        return this.setProp('batchResultQuantity', amount);
    }

    public batchResultUnitOfMeasureById(id: number): this {
        return this.setPropById(this.unitService.findOne.bind(this.unitService), 'batchResultUnitOfMeasure', id);
    }

    public batchResultUnitOfMeasureByName(name: string): this {
        return this.setPropByName(this.unitService.findOneByName.bind(this.unitService), 'batchResultUnitOfMeasure', name);
    }

    public servingSizeQuantity(amount: number): this {
        return this.setProp('servingSizeQuantity', amount);
    }

    public servingUnitOfMeasureById(id: number): this {
        return this.setPropById(this.unitService.findOne.bind(this.unitService), 'servingSizeUnitOfMeasure', id);
    }

    public servingUnitOfMeasureByName(name: string): this {
        return this.setPropByName(this.unitService.findOneByName.bind(this.unitService), 'servingSizeUnitOfMeasure', name);
    }

    public salesPrice(amount: number): this {
        return this.setProp('salesPrice', amount);
    }

    public cost(amount: number): this {
        return this.setProp('cost', amount);
    }

    public categoryById(id: number): this {
        return this.setPropById(this.categoryService.findOne.bind(this.categoryService), 'category', id);
    }

    public categoryByName(name: string): this {
        return this.setPropByName(this.categoryService.findOneByName.bind(this.categoryService), 'category', name);
    }

    public subCategoryById(id: number): this {
        return this.setPropById(this.subCategoryService.findOne.bind(this.subCategoryService), 'subCategory', id);
    }

    public subCategoryByName(name: string): this {
        return this.setPropByName(this.subCategoryService.findOneByName.bind(this.subCategoryService), 'subCategory', name);
    }

    public async buildCreateDto(dto: CreateRecipeDto): Promise<Recipe> {
        this.reset();

        if(dto.batchResultQuantity){
            this.batchResultQuantity(dto.batchResultQuantity);
        }
        if(dto.batchResultUnitOfMeasureId){
            this.batchResultUnitOfMeasureById(dto.batchResultUnitOfMeasureId);
        }
        // if no category specified on creation, set to default category: "No Category"
        if(dto.categoryId){
            this.categoryById(dto.categoryId);
        }
        else{
            //const defaultCategory = await this.categoryService.findOneByName(REC_CAT_NONE);
            //if(!defaultCategory){ throw new Error("default category (NO CATEGORY) is null"); }
            //this.categoryById(defaultCategory.id);
            this.categoryByName(REC_CAT_NONE);
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
        // if no category specified on creation, set to default sub-category: "No Sub-Category"
        if(dto.subCategoryId){
            this.subCategoryById(dto.subCategoryId);
        }else{
            //const defaultCategory = await this.subCategoryService.findOneByName(REC_SUBCAT_NONE);
            //if(!defaultCategory){ throw new Error("default sub-category (NO CATEGORY) is null"); }
            //this.subCategoryById(defaultCategory.id);
            this.subCategoryByName(REC_SUBCAT_NONE);
        }

        return await this.build();
    }

    // handle if category/sub-category is 0, set to NO-|Sub|Category
    public async buildUpdateDto(toUpdate: Recipe, dto: UpdateRecipeDto): Promise<Recipe> {
        this.reset();
        this.updateEntity(toUpdate);

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