import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { RecipeIngredient } from "../entities/recipe-ingredient.entity";
import { RecipeService } from "../services/recipe.service";
import { InventoryItemService } from "../../inventory-items/services/inventory-item.service";
import { UnitOfMeasureService } from "../../unit-of-measure/services/unit-of-measure.service";
import { Recipe } from "../entities/recipe.entity";
import { InventoryItem } from "../../inventory-items/entities/inventory-item.entity";
import { UnitOfMeasure } from "../../unit-of-measure/entities/unit-of-measure.entity";
import { BuilderMethodBase } from "../../../base/builder-method-base";
import { CreateRecipeIngredientDto } from "../dto/create-recipe-ingredient.dto";
import { UpdateRecipeIngredientDto } from "../dto/update-recipe-ingedient.dto";

@Injectable()
export class RecipeIngredientBuilder {
    private ingredient: RecipeIngredient;
    private taskQueue: (() => Promise<void>)[];

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
        this.taskQueue = [];
        return this;
    }

    public recipeById(id: number): this {
        this.taskQueue.push(async () => {
            await this.recipeMethods.entityById(
                (rec) => { this.ingredient.recipe = rec; },
                id,
            );
        });
        return this;
    }

    public recipeByName(name: string): this {
        this.taskQueue.push(async () => {
            await this.recipeMethods.entityByName(
                (rec) => { this.ingredient.recipe = rec; },
                name,
            );
        });
        return this;
    }

    public inventoryItemById(id: number): this {
        this.taskQueue.push(async () => {
            await this.itemMethods.entityById(
                (item) => { this.ingredient.inventoryItem = item; },
                id,
            );
        });
        return this;
    }

    public inventoryItemByName(name: string): this {
        this.taskQueue.push(async () => {
            await this.itemMethods.entityByName(
                (item) => { this.ingredient.inventoryItem = item; },
                name,
            );
        });
        return this;
    }

    public subRecipeById(id: number): this {
        this.taskQueue.push(async () => {
            await this.recipeMethods.entityById(
                (subRec) => { this.ingredient.subRecipeIngredient = subRec; },
                id,
            );
        });
        return this;
    }

    public subRecipeByName(name: string): this {
        this.taskQueue.push(async () => {
            await this.recipeMethods.entityByName(
                (subRec) => { this.ingredient.subRecipeIngredient = subRec; },
                name,
            );
        });
        return this;
    }

    public quantity(amount: number): this {
        this.ingredient.quantity = amount;
        return this;
    }

    public unitOfMeasureById(id: number): this {
        this.taskQueue.push(async () => {
            await this.unitMethods.entityById(
                (unit) => { this.ingredient.unit = unit; },
                id,
            );
        });
        return this;
    }

    public unitOfMeasureByName(name: string): this {
        this.taskQueue.push(async () => {
            await this.unitMethods.entityByName(
                (unit) => { this.ingredient.unit = unit; },
                name,
            );
        });
        return this;
    }

    public async build(): Promise<RecipeIngredient> {
        for(const task of this.taskQueue){
            await task();
        }
        
        const result = this.ingredient;
        this.reset();
        return result;
    }

    public async buildCreateDto(dto: CreateRecipeIngredientDto): Promise<RecipeIngredient>{
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

    public updateIngredient(toUpdate: RecipeIngredient): this {
        this.ingredient = toUpdate;
        return this;
    }

    public async buildUpdateDto(toUpdate: RecipeIngredient, dto: UpdateRecipeIngredientDto): Promise<RecipeIngredient> {
        this.reset();
        this.updateIngredient(toUpdate);

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
}