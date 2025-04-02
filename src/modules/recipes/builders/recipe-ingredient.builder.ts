import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { InventoryItemService } from "../../inventory-items/services/inventory-item.service";
import { UnitOfMeasureService } from "../../unit-of-measure/services/unit-of-measure.service";
import { CreateRecipeIngredientDto } from "../dto/create-recipe-ingredient.dto";
import { UpdateRecipeIngredientDto } from "../dto/update-recipe-ingedient.dto";
import { RecipeIngredient } from "../entities/recipe-ingredient.entity";
import { RecipeService } from "../services/recipe.service";

@Injectable()
export class RecipeIngredientBuilder extends BuilderBase<RecipeIngredient>{
    constructor(
        @Inject(forwardRef(() => RecipeService))
        private readonly recipeService: RecipeService,
        private readonly itemService: InventoryItemService,
        private readonly unitService: UnitOfMeasureService,
    ){ super(RecipeIngredient); }

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

    public async buildUpdateDto(toUpdate: RecipeIngredient, dto: UpdateRecipeIngredientDto): Promise<RecipeIngredient> {
        this.reset();
        this.updateEntity(toUpdate);

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