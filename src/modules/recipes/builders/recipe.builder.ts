import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { AppLogger } from "../../app-logging/app-logger";
import { MenuItemService } from "../../menu-items/services/menu-item.service";
import { RequestContextService } from "../../request-context/RequestContextService";
import { UnitOfMeasureService } from "../../unit-of-measure/services/unit-of-measure.service";
import { CreateChildRecipeIngredientDto } from "../dto/recipe-ingredient/create-child-recipe-ingredient.dto";
import { UpdateRecipeIngredientDto } from "../dto/recipe-ingredient/update-recipe-ingedient.dto";
import { CreateRecipeDto } from "../dto/recipe/create-recipe.dto";
import { UpdateRecipeDto } from "../dto/recipe/update-recipe-dto";
import { Recipe } from "../entities/recipe.entity";
import { RecipeCategoryService } from "../services/recipe-category.service";
import { RecipeIngredientService } from "../services/recipe-ingredient.service";
import { RecipeSubCategoryService } from "../services/recipe-sub-category.service";
import { RecipeValidator } from "../validators/recipe.valdiator";
import { RecipeIngredientBuilder } from "./recipe-ingredient.builder";

@Injectable()
export class RecipeBuilder extends BuilderBase<Recipe> {
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
    ) { super(Recipe, 'RecipeBuilder', requestContextService, logger, validator); }

    protected createEntity(dto: CreateRecipeDto): void {
        if (dto.batchResultQuantity !== undefined) {
            this.batchResultQuantity(dto.batchResultQuantity);
        }
        if (dto.batchResultMeasurementId !== undefined) {
            this.batchResultMeasurementById(dto.batchResultMeasurementId);
        }
        if (dto.categoryId !== undefined) {
            this.categoryById(dto.categoryId);
        }
        if (dto.isIngredient !== undefined) {
            this.isIngredient(dto.isIngredient);
        }
        if (dto.producedMenuItemId !== undefined) {
            this.producedMenuItemById(dto.producedMenuItemId);
        }
        if (dto.recipeName !== undefined) {
            this.name(dto.recipeName);
        }
        if (dto.salesPrice !== undefined) {
            this.salesPrice(dto.salesPrice);
        }
        if (dto.servingSizeQuantity !== undefined) {
            this.servingSizeQuantity(dto.servingSizeQuantity);
        }
        if (dto.servingSizeMeasurementId !== undefined) {
            this.servingSizeMeasurementById(dto.servingSizeMeasurementId);
        }
        if (dto.subCategoryId !== undefined) {
            this.subCategoryById(dto.subCategoryId);
        }
        if (dto.ingredientDtos !== undefined) {
            this.ingredientsByBuilder(this.entity.id, dto.ingredientDtos);
        }
    }

    protected updateEntity(dto: UpdateRecipeDto): void {
        if (dto.batchResultQuantity !== undefined) {
            this.batchResultQuantity(dto.batchResultQuantity);
        }
        if (dto.batchResultMeasurementId !== undefined) {
            this.batchResultMeasurementById(dto.batchResultMeasurementId);
        }
        if (dto.categoryId !== undefined) {
            this.categoryById(dto.categoryId);

            if (dto.subCategoryId === undefined) {
                this.subCategoryById(null);
            }
        }
        if (dto.isIngredient !== undefined) {
            this.isIngredient(dto.isIngredient);
        }
        if (dto.producedMenuItemId !== undefined) {
            this.producedMenuItemById(dto.producedMenuItemId);
        }
        if (dto.recipeName !== undefined) {
            this.name(dto.recipeName);
        }
        if (dto.salesPrice !== undefined) {
            this.salesPrice(dto.salesPrice);
        }
        if (dto.servingSizeQuantity !== undefined) {
            this.servingSizeQuantity(dto.servingSizeQuantity);
        }
        if (dto.servingSizeMeasurementId !== undefined) {
            this.servingSizeMeasurementById(dto.servingSizeMeasurementId);
        }
        if (dto.subCategoryId !== undefined) {
            this.subCategoryById(dto.subCategoryId);
        }
        if (dto.ingredientDtos !== undefined) {
            this.ingredientsByBuilder(this.entity.id, dto.ingredientDtos);
        }
    }

    public name(name: string): this {
        return this.setPropByVal('recipeName', name);
    }

    public producedMenuItemById(id: number | null): this {
        if (id === null) {
            return this.setPropByVal('producedMenuItem', null);
        }
        return this.setPropById(this.menuItemService.findOne.bind(this.menuItemService), 'producedMenuItem', id);
    }

    public producedMenuItemByName(name: string): this {
        return this.setPropByName(this.menuItemService.findOneByName.bind(this.menuItemService), 'producedMenuItem', name);
    }

    public isIngredient(value: boolean): this {
        return this.setPropByVal('isIngredient', value);
    }

    public ingredientsById(ids: number[]): this {
        return this.setPropsByIds(this.ingredientService.findEntitiesById.bind(this.ingredientService), 'ingredients', ids);
    }

    public ingredientsByBuilder(recipeId: number, dtos: (CreateChildRecipeIngredientDto | UpdateRecipeIngredientDto)[]): this {
        const enrichedDtos = dtos.map(dto => ({
            ...dto,
            recipeId,
        }));
        return this.setPropByBuilder(this.ingredientBuilder.buildManyDto.bind(this.ingredientBuilder), 'ingredients', this.entity, enrichedDtos);
    }

    public batchResultQuantity(amount: number | null): this {
        if (amount === null) {
            return this.setPropByVal('batchResultQuantity', null);
        }
        return this.setPropByVal('batchResultQuantity', amount);
    }

    public batchResultMeasurementById(id: number | null): this {
        if (id === null) {
            return this.setPropByVal('batchResultMeasurement', null);
        }
        return this.setPropById(this.unitService.findOne.bind(this.unitService), 'batchResultMeasurement', id);
    }

    public batchResultMeasurementByName(name: string): this {
        return this.setPropByName(this.unitService.findOneByName.bind(this.unitService), 'batchResultMeasurement', name);
    }

    public servingSizeQuantity(amount: number | null): this {
        if (amount === null) {
            return this.setPropByVal('servingSizeQuantity', null);
        }
        return this.setPropByVal('servingSizeQuantity', amount);
    }

    public servingSizeMeasurementById(id: number | null): this {
        if (id === null) {
            return this.setPropByVal('servingSizeMeasurement', null);
        }
        return this.setPropById(this.unitService.findOne.bind(this.unitService), 'servingSizeMeasurement', id);
    }

    public servingSizeMeasurementByName(name: string): this {
        return this.setPropByName(this.unitService.findOneByName.bind(this.unitService), 'servingSizeMeasurement', name);
    }

    public salesPrice(amount: number | null): this {
        if (amount === null) {
            return this.setPropByVal('salesPrice', null);
        }
        return this.setPropByVal('salesPrice', String(amount));
    }

    public categoryById(id: number | null): this {
        if (id === null) {
            return this.setPropByVal('category', null);
        }
        return this.setPropById(this.categoryService.findOne.bind(this.categoryService), 'category', id);
    }

    public categoryByName(name: string): this {
        return this.setPropByName(this.categoryService.findOneByName.bind(this.categoryService), 'category', name);
    }

    public subCategoryById(id: number | null): this {
        if (id === null) {
            return this.setPropByVal('subCategory', null);
        }
        return this.setPropById(this.subCategoryService.findOne.bind(this.subCategoryService), 'subCategory', id);
    }

    public subCategoryByName(name: string): this {
        return this.setPropByName(this.subCategoryService.findOneByName.bind(this.subCategoryService), 'subCategory', name);
    }
}