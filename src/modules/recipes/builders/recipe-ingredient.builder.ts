import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { IBuildChildDto } from "../../../base/interfaces/IBuildChildEntity.interface";
import { RequestContextService } from "../../request-context/RequestContextService";
import { InventoryItemService } from "../../inventory-items/services/inventory-item.service";
import { AppLogger } from "../../app-logging/app-logger";
import { UnitOfMeasureService } from "../../unit-of-measure/services/unit-of-measure.service";
import { CreateChildRecipeIngredientDto } from "../dto/recipe-ingredient/create-child-recipe-ingredient.dto";
import { CreateRecipeIngredientDto } from "../dto/recipe-ingredient/create-recipe-ingredient.dto";
import { UpdateChildRecipeIngredientDto } from "../dto/recipe-ingredient/update-child-recipe-ingedient.dto";
import { UpdateRecipeIngredientDto } from "../dto/recipe-ingredient/update-recipe-ingedient.dto";
import { RecipeIngredient } from "../entities/recipe-ingredient.entity";
import { Recipe } from "../entities/recipe.entity";
import { RecipeIngredientService } from "../services/recipe-ingredient.service";
import { RecipeService } from "../services/recipe.service";
import { RecipeIngredientValidator } from "../validators/recipe-ingredient.validator";

@Injectable()
export class RecipeIngredientBuilder extends BuilderBase<RecipeIngredient> implements IBuildChildDto<Recipe, RecipeIngredient>{
    constructor(
        @Inject(forwardRef(() => RecipeService))
        private readonly recipeService: RecipeService,

        @Inject(forwardRef(() => RecipeIngredientService))
        private readonly ingredientService: RecipeIngredientService,

        private readonly itemService: InventoryItemService,
        private readonly unitService: UnitOfMeasureService,
        validator: RecipeIngredientValidator,
        requestContextService: RequestContextService,
        logger: AppLogger,
    ){ super(RecipeIngredient, 'RecipeIngredientBuilder', requestContextService, logger, validator); }

    /**
     * Depreciated, only created as a child through {@link Recipe}.
     */
    protected createEntity(dto: CreateRecipeIngredientDto): void {
        if(dto.ingredientInventoryItemId !== undefined){
            this.ingredientInventoryItemById(dto.ingredientInventoryItemId);
        }
        if(dto.quantity !== undefined){
            this.quantity(dto.quantity);
        }
        if(dto.parentRecipeId !== undefined){
            this.parentRecipeById(dto.parentRecipeId);
        } 
        if(dto.ingredientRecipeId !== undefined){
            this.ingredientRecipeById(dto.ingredientRecipeId);
        }
        if(dto.quantityMeasurementId !== undefined){
            this.quantityUnitOfMeasureById(dto.quantityMeasurementId);
        }
    }

    protected updateEntity(dto: UpdateRecipeIngredientDto): void {
        if(dto.ingredientInventoryItemId !== undefined){
            this.entity.ingredientRecipe = null;
            this.ingredientInventoryItemById(dto.ingredientInventoryItemId);
        }
        if(dto.quantity !== undefined){
            this.quantity(dto.quantity);
        }
        if(dto.ingredientRecipeId !== undefined){
            this.entity.ingredientInventoryItem = null;
            this.ingredientRecipeById(dto.ingredientRecipeId);
        }
        if(dto.quantityMeasurementId !== undefined){
            this.quantityUnitOfMeasureById(dto.quantityMeasurementId);
        }
    }

    buildChildEntity(dto: CreateChildRecipeIngredientDto): void {
        if(dto.ingredientInventoryItemId !== undefined){
            this.ingredientInventoryItemById(dto.ingredientInventoryItemId);
        }
        if(dto.quantity !== undefined){
            this.quantity(dto.quantity);
        }
        if(dto.ingredientRecipeId !== undefined){
            this.ingredientRecipeById(dto.ingredientRecipeId);
        }
        if(dto.quantityMeasurementId !== undefined){
            this.quantityUnitOfMeasureById(dto.quantityMeasurementId);
        }
    }

    async buildChildCreateDto(parent: Recipe, dto: CreateChildRecipeIngredientDto): Promise<RecipeIngredient> {
        await this.validateCreateDto(dto);

        this.reset();

        this.entity.parentRecipe = parent;

        this.buildChildEntity(dto);

        return await this.build();
    }

    /**
     * Handles both create and update recipe ingredient DTOs, for when updating recipes involving new and modified ingredients.
     * @param parentRecipe
     * @param dtos 
     * @returns 
     */
    public async buildManyDto(parentRecipe: Recipe, dtos: (CreateChildRecipeIngredientDto | UpdateChildRecipeIngredientDto)[]): Promise<RecipeIngredient[]> {
        const results: RecipeIngredient[] = [];
        for(const dto of dtos){
            if(dto.mode === 'create'){
                results.push( await this.buildChildCreateDto(parentRecipe, dto));
            } else {
                const ingred = await this.ingredientService.findOne(dto.id);
                if(!ingred){ throw new Error("recipe ingredient not found"); }
                results.push( await this.buildUpdateDto(ingred, dto));
            }
        }
        return results;
    }

    public parentRecipeById(id: number): this {
        return this.setPropById(this.recipeService.findOne.bind(this.recipeService), 'parentRecipe', id);
    }

    public parentRecipeByName(name: string): this {
        return this.setPropByName(this.recipeService.findOneByName.bind(this.recipeService), 'parentRecipe', name);
    }

    public ingredientInventoryItemById(id: number | null): this {
        if(id === null){
            return this.setPropByVal('ingredientInventoryItem', null);
        }
        return this.setPropById(this.itemService.findOne.bind(this.itemService), 'ingredientInventoryItem', id);
    }

    public ingredientInventoryItemByName(name: string): this {
        return this.setPropByName(this.itemService.findOneByName.bind(this.itemService), 'ingredientInventoryItem', name);
    }

    public ingredientRecipeById(id: number | null): this {
        if(id === null){
            return this.setPropByVal('ingredientRecipe', null);
        }
        return this.setPropById(this.recipeService.findOne.bind(this.recipeService), 'ingredientRecipe', id);
    }

    public ingredientRecipeByName(name: string): this {
        return this.setPropByName(this.recipeService.findOneByName.bind(this.recipeService), 'ingredientRecipe', name);
    }

    public quantity(amount: number): this {
        return this.setPropByVal('quantity', amount);
    }

    public quantityUnitOfMeasureById(id: number): this {
        return this.setPropById(this.unitService.findOne.bind(this.unitService), 'quantityMeasure', id);
    }

    public quantityUnitOfMeasureByName(name: string): this {
        return this.setPropByName(this.unitService.findOneByName.bind(this.unitService), 'quantityMeasure', name);
    }
}