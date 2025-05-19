import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { RequestContextService } from "../../request-context/RequestContextService";
import { AppLogger } from "../../app-logging/app-logger";
import { MenuItemService } from "../../menu-items/services/menu-item.service";
import { UnitOfMeasureService } from "../../unit-of-measure/services/unit-of-measure.service";
import { CreateChildRecipeIngredientDto } from "../dto/recipe-ingredient/create-child-recipe-ingredient.dto";
import { CreateRecipeDto } from "../dto/recipe/create-recipe.dto";
import { UpdateRecipeDto } from "../dto/recipe/update-recipe-dto";
import { UpdateRecipeIngredientDto } from "../dto/recipe-ingredient/update-recipe-ingedient.dto";
import { Recipe } from "../entities/recipe.entity";
import { RecipeCategoryService } from "../services/recipe-category.service";
import { RecipeIngredientService } from "../services/recipe-ingredient.service";
import { RecipeSubCategoryService } from "../services/recipe-sub-category.service";
import { RecipeValidator } from "../validators/recipe.valdiator";
import { RecipeIngredientBuilder } from "./recipe-ingredient.builder";

@Injectable()
export class RecipeBuilder extends BuilderBase<Recipe>{
    constructor(
        @Inject(forwardRef(() => RecipeIngredientService))
        private readonly ingredientService: RecipeIngredientService,
        
        @Inject(forwardRef(() => RecipeCategoryService))
        private readonly categoryService: RecipeCategoryService,
        
        @Inject(forwardRef(() => RecipeSubCategoryService))
        private readonly subCategoryService: RecipeSubCategoryService,

        @Inject(forwardRef(() => RecipeIngredientBuilder))
        private readonly ingredientBuilder: RecipeIngredientBuilder,

        private readonly unitService: UnitOfMeasureService,
        private readonly menuItemService: MenuItemService,
        
        validator: RecipeValidator,
        requestContextService: RequestContextService,
        logger: AppLogger,
    ){ super(Recipe, 'RecipeBuilder', requestContextService, logger, validator); }

    protected createEntity(dto: CreateRecipeDto): void {
        if(dto.batchResultQuantity){
            this.batchResultQuantity(dto.batchResultQuantity);
        }
        if(dto.batchResultUnitOfMeasureId){
            this.batchResultUnitOfMeasureById(dto.batchResultUnitOfMeasureId);
        }
        if(dto.categoryId){
            this.categoryById(dto.categoryId);
        }
        if(dto.isIngredient){
            this.isIngredient(dto.isIngredient);
        }
        if(dto.menuItemId){
            this.menuItemById(dto.menuItemId);
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
        if(dto.ingredientDtos){
            this.ingredientsByBuilder(this.entity.id, dto.ingredientDtos);
        }
    }

    protected updateEntity(dto: UpdateRecipeDto): void {
        if(dto.batchResultQuantity){
            this.batchResultQuantity(dto.batchResultQuantity);
        }
        if(dto.batchResultUnitOfMeasureId){
            this.batchResultUnitOfMeasureById(dto.batchResultUnitOfMeasureId);
        }
        if(dto.categoryId !== undefined){
            this.categoryById(dto.categoryId);

            if(dto.subCategoryId !== undefined){
                this.subCategoryById(dto.subCategoryId);
            } else {
                this.subCategoryById(0);
            }
        }
        if(dto.isIngredient){
            this.isIngredient(dto.isIngredient);
        }
        if(dto.menuItemId !== undefined){
            this.menuItemById(dto.menuItemId);
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
        if(dto.subCategoryId !== undefined){
            this.subCategoryById(dto.subCategoryId);
        }
        if(dto.ingredientDtos){
            this.ingredientsByBuilder(this.entity.id, dto.ingredientDtos);
        }
    }

    public name(name: string): this {
        return this.setPropByVal('name', name);
    }
    
    public menuItemById(id: number): this {
        if(id === 0){
            return this.setPropByVal('menuItem', null);
        }
        return this.setPropById(this.menuItemService.findOne.bind(this.menuItemService), 'menuItem',id);
    }

    public menuItemByName(name: string): this {
        return this.setPropByName(this.menuItemService.findOneByName.bind(this.menuItemService), 'menuItem', name);
    }

    public isIngredient(value: boolean): this {
        return this.setPropByVal('isIngredient', value);
    }

    public ingredientsById(ids: number[]): this {
        return this.setPropsByIds(this.ingredientService.findEntitiesById.bind(this.ingredientService), 'ingredients', ids);
    }

    public ingredientsByBuilder(recipeId: number, dtos: (CreateChildRecipeIngredientDto | UpdateRecipeIngredientDto)[]): this {
        const enrichedDtos = dtos.map( dto => ({
            ...dto,
            recipeId,
        }));
        return this.setPropByBuilder(this.ingredientBuilder.buildManyDto.bind(this.ingredientBuilder), 'ingredients', this.entity, enrichedDtos);
    }

    public batchResultQuantity(amount: number): this {
        return this.setPropByVal('batchResultQuantity', amount);
    }

    public batchResultUnitOfMeasureById(id: number): this {
        return this.setPropById(this.unitService.findOne.bind(this.unitService), 'batchResultUnitOfMeasure', id);
    }

    public batchResultUnitOfMeasureByName(name: string): this {
        return this.setPropByName(this.unitService.findOneByName.bind(this.unitService), 'batchResultUnitOfMeasure', name);
    }

    public servingSizeQuantity(amount: number): this {
        return this.setPropByVal('servingSizeQuantity', amount);
    }

    public servingUnitOfMeasureById(id: number): this {
        return this.setPropById(this.unitService.findOne.bind(this.unitService), 'servingSizeUnitOfMeasure', id);
    }

    public servingUnitOfMeasureByName(name: string): this {
        return this.setPropByName(this.unitService.findOneByName.bind(this.unitService), 'servingSizeUnitOfMeasure', name);
    }

    public salesPrice(amount: number): this {
        return this.setPropByVal('salesPrice', String(amount));
    }

    public categoryById(id: number): this {
        if(id === 0){
            return this.setPropByVal('category', null);
        }
        return this.setPropById(this.categoryService.findOne.bind(this.categoryService), 'category', id);
    }

    public categoryByName(name: string): this {
        return this.setPropByName(this.categoryService.findOneByName.bind(this.categoryService), 'category', name);
    }

    public subCategoryById(id: number): this {
        if(id === 0){
            return this.setPropByVal('subCategory', null);
        }
        return this.setPropById(this.subCategoryService.findOne.bind(this.subCategoryService), 'subCategory', id);
    }

    public subCategoryByName(name: string): this {
        return this.setPropByName(this.subCategoryService.findOneByName.bind(this.subCategoryService), 'subCategory', name);
    }
}