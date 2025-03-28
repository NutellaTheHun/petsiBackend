import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { RecipeIngredient } from "../entities/recipe-ingredient.entity";
import { RecipeService } from "../services/recipe.service";
import { InventoryItemService } from "../../inventory-items/services/inventory-item.service";
import { UnitOfMeasureService } from "../../unit-of-measure/services/unit-of-measure.service";
import { Recipe } from "../entities/recipe.entity";
import { InventoryItem } from "../../inventory-items/entities/inventory-item.entity";
import { UnitOfMeasure } from "../../unit-of-measure/entities/unit-of-measure.entity";
import { BuilderMethodBase } from "../../../base/builder-method-base";
import { dot } from "node:test/reporters";
import { CreateRecipeIngredientDto } from "../dto/create-recipe-ingredient.dto";
import { UpdateRecipeIngredientDto } from "../dto/update-recipe-ingedient.dto";

@Injectable()
export class RecipeIngredientBuilder {
    private ingredient: RecipeIngredient;
    private recipeMethods: BuilderMethodBase<Recipe>;
    private itemMethods: BuilderMethodBase<InventoryItem>;
    private unitMethods: BuilderMethodBase<UnitOfMeasure>;

    constructor(
        @Inject(forwardRef(() => RecipeService))
        private readonly recipeService: RecipeService,
        private readonly inventoryItemService: InventoryItemService,
        private readonly unitOfMeasureService: UnitOfMeasureService,
    ){ 
        this.reset(); 
        this.recipeMethods = new BuilderMethodBase(this.recipeService, this.recipeService.findOneByName.bind(this.recipeService));
        this.itemMethods = new BuilderMethodBase(this.inventoryItemService, this.inventoryItemService.findOneByName.bind(this.inventoryItemService));
        this.unitMethods = new BuilderMethodBase(this.unitOfMeasureService, this.unitOfMeasureService.findOneByName.bind(this.unitOfMeasureService));
    }

    public reset(): this {
        this.ingredient = new RecipeIngredient;
        return this;
    }

    public async recipeById(id: number): Promise<this> {
        await this.recipeMethods.entityById(
            (rec) => { this.ingredient.recipe = rec; },
            id,
        );
        return this;
    }

    public async recipeByName(name: string): Promise<this> {
        await this.recipeMethods.entityByName(
            (rec) => { this.ingredient.recipe = rec; },
            name,
        );
        return this;
    }

    public async inventoryItemById(id: number): Promise<this> {
        await this.itemMethods.entityById(
            (item) => { this.ingredient.inventoryItem = item; },
            id,
        );
        return this;
    }

    public async inventoryItemByName(name: string): Promise<this> {
        await this.itemMethods.entityByName(
            (item) => { this.ingredient.inventoryItem = item; },
            name,
        );
        return this;
    }

    public async subRecipeById(id: number): Promise<this> {
        await this.recipeMethods.entityById(
            (subRec) => { this.ingredient.subRecipeIngredient = subRec; },
            id,
        );
        return this;
    }

    public async subRecipeByName(name: string): Promise<this> {
        await this.recipeMethods.entityByName(
            (subRec) => { this.ingredient.subRecipeIngredient = subRec; },
            name,
        );
        return this;
    }

    public quantity(amount: number): this {
        this.ingredient.quantity = amount;
        return this;
    }

    public async unitOfMeasureById(id: number): Promise<this> {
        await this.unitMethods.entityById(
            (unit) => { this.ingredient.unit = unit; },
            id,
        );
        return this;
    }

    public async unitOfMeasureByName(name: string): Promise<this> {
        await this.unitMethods.entityByName(
            (unit) => { this.ingredient.unit = unit; },
            name,
        );
        return this;
    }

    public getIngredient(): RecipeIngredient {
        const result = this.ingredient;
        this.reset();
        return result;
    }

    public async buildCreateDto(dto: CreateRecipeIngredientDto): Promise<RecipeIngredient>{
        this.reset();

        if(dto.inventoryItemId){
            await this.inventoryItemById(dto.inventoryItemId);
        }
        if(dto.quantity){
            this.quantity(dto.quantity);
        }
        if(dto.recipeId){
            await this.recipeById(dto.recipeId);
        }
        if(dto.subRecipeIngredientId){
            await this.subRecipeById(dto.subRecipeIngredientId);
        }
        if(dto.unitOfMeasureId){
            await this.unitOfMeasureById(dto.unitOfMeasureId);
        }

        return this.getIngredient();
    } 

    public updateIngredient(toUpdate: RecipeIngredient): this {
        this.ingredient = toUpdate;
        return this;
    }

    public async buildUpdateDto(toUpdate: RecipeIngredient, dto: UpdateRecipeIngredientDto): Promise<RecipeIngredient> {
        this.reset();
        this.updateIngredient(toUpdate);

        if(dto.inventoryItemId){
            await this.inventoryItemById(dto.inventoryItemId);
        }
        if(dto.quantity){
            this.quantity(dto.quantity);
        }
        if(dto.recipeId){
            await this.recipeById(dto.recipeId);
        }
        if(dto.subRecipeIngredientId){
            await this.subRecipeById(dto.subRecipeIngredientId);
        }
        if(dto.unitOfMeasureId){
            await this.unitOfMeasureById(dto.unitOfMeasureId);
        }

        return this.getIngredient();
    }
}