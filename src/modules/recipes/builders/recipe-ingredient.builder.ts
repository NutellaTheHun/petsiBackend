import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { IBuildChildDto } from "../../../base/interfaces/IBuildChildEntity.interface";
import { InventoryItemService } from "../../inventory-items/services/inventory-item.service";
import { UnitOfMeasureService } from "../../unit-of-measure/services/unit-of-measure.service";
import { CreateChildRecipeIngredientDto } from "../dto/create-child-recipe-ingredient.dto";
import { CreateRecipeIngredientDto } from "../dto/create-recipe-ingredient.dto";
import { UpdateChildRecipeIngredientDto } from "../dto/update-child-recipe-ingedient.dto copy";
import { UpdateRecipeIngredientDto } from "../dto/update-recipe-ingedient.dto";
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
    ){ super(RecipeIngredient, validator); }

    protected async createEntity(dto: CreateRecipeIngredientDto): Promise<void> {
        if(dto.inventoryItemId){
            this.inventoryItemById(dto.inventoryItemId);
        }
        if(dto.quantity){
            this.quantity(dto.quantity);
        }
        if(dto.recipeId){
            this.recipeById(dto.recipeId);
        } 
        if(dto.subRecipeIngredientId){
            this.subRecipeById(dto.subRecipeIngredientId);
        }
        if(dto.unitOfMeasureId){
            this.unitOfMeasureById(dto.unitOfMeasureId);
        }
    }

    protected async updateEntity(dto: UpdateRecipeIngredientDto): Promise<void> {
        if(dto.inventoryItemId){
            this.entity.subRecipeIngredient = null;
            this.inventoryItemById(dto.inventoryItemId);
        }
        if(dto.quantity){
            this.quantity(dto.quantity);
        }
        if(dto.subRecipeIngredientId){
            this.entity.inventoryItem = null;
            this.subRecipeById(dto.subRecipeIngredientId);
        }
        if(dto.unitOfMeasureId){
            this.unitOfMeasureById(dto.unitOfMeasureId);
        }
    }

    async buildChildEntity(dto: CreateChildRecipeIngredientDto): Promise<void> {
        if(dto.inventoryItemId){
            this.inventoryItemById(dto.inventoryItemId);
        }
        if(dto.quantity){
            this.quantity(dto.quantity);
        }
        if(dto.subRecipeIngredientId){
            this.subRecipeById(dto.subRecipeIngredientId);
        }
        if(dto.unitOfMeasureId){
            this.unitOfMeasureById(dto.unitOfMeasureId);
        }
    }

    async buildChildCreateDto(parent: Recipe, dto: CreateChildRecipeIngredientDto): Promise<RecipeIngredient> {
        await this.validateCreateDto(dto);

        this.reset();

        this.entity.recipe = parent;

        await this.buildChildEntity(dto);

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

    public recipeById(id: number): this {
        return this.setPropById(this.recipeService.findOne.bind(this.recipeService), 'recipe', id);
    }

    public recipeByName(name: string): this {
        return this.setPropByName(this.recipeService.findOneByName.bind(this.recipeService), 'recipe', name);
    }

    public inventoryItemById(id: number): this {
        return this.setPropById(this.itemService.findOne.bind(this.itemService), 'inventoryItem', id);
    }

    public inventoryItemByName(name: string): this {
        return this.setPropByName(this.itemService.findOneByName.bind(this.itemService), 'inventoryItem', name);
    }

    public subRecipeById(id: number): this {
        return this.setPropById(this.recipeService.findOne.bind(this.recipeService), 'subRecipeIngredient', id);
    }

    public subRecipeByName(name: string): this {
        return this.setPropByName(this.recipeService.findOneByName.bind(this.recipeService), 'subRecipeIngredient', name);
    }

    public quantity(amount: number): this {
        return this.setProp('quantity', amount);
    }

    public unitOfMeasureById(id: number): this {
        return this.setPropById(this.unitService.findOne.bind(this.unitService), 'unit', id);
    }

    public unitOfMeasureByName(name: string): this {
        return this.setPropByName(this.unitService.findOneByName.bind(this.unitService), 'unit', name);
    }

    /*public async buildChildCreateDto(parentRecipe: Recipe, dto: CreateRecipeIngredientDto): Promise<RecipeIngredient>{
        this.reset();

        this.entity.recipe = parentRecipe;

        if(dto.inventoryItemId){
            this.inventoryItemById(dto.inventoryItemId);
        }
        if(dto.quantity){
            this.quantity(dto.quantity);
        }
        if(dto.subRecipeIngredientId){
            this.subRecipeById(dto.subRecipeIngredientId);
        }
        if(dto.unitOfMeasureId){
            this.unitOfMeasureById(dto.unitOfMeasureId);
        }

        return await this.build();
    }

    public async buildCreateDto( dto: CreateRecipeIngredientDto): Promise<RecipeIngredient>{
        this.reset();

        if(dto.inventoryItemId){
            this.inventoryItemById(dto.inventoryItemId);
        }
        if(dto.quantity){
            this.quantity(dto.quantity);
        }
        if(dto.recipeId){
            this.recipeById(dto.recipeId);
        } 
        if(dto.subRecipeIngredientId){
            this.subRecipeById(dto.subRecipeIngredientId);
        }
        if(dto.unitOfMeasureId){
            this.unitOfMeasureById(dto.unitOfMeasureId);
        }

        return await this.build();
    }

    public async buildUpdateDto(toUpdate: RecipeIngredient, dto: UpdateRecipeIngredientDto): Promise<RecipeIngredient> {
        this.reset();
        this.setEntity(toUpdate);
        
        if(dto.inventoryItemId){
            this.entity.subRecipeIngredient = null;
            this.inventoryItemById(dto.inventoryItemId);
        }
        if(dto.quantity){
            this.quantity(dto.quantity);
        }
        if(dto.subRecipeIngredientId){
            this.entity.inventoryItem = null;
            this.subRecipeById(dto.subRecipeIngredientId);
        }
        if(dto.unitOfMeasureId){
            this.unitOfMeasureById(dto.unitOfMeasureId);
        }

        return await this.build();
    }*/
}