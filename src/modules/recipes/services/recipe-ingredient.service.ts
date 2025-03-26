import { InjectRepository } from "@nestjs/typeorm";
import { ServiceBase } from "../../../base/service-base";
import { RecipeIngredient } from "../entities/recipe-ingredient.entity";
import { Repository } from "typeorm";
import { RecipeIngredientFactory } from "../factories/recipe-ingredient.factory";
import { forwardRef, Inject, NotImplementedException } from "@nestjs/common";
import { CreateRecipeIngredientDto } from "../dto/create-recipe-ingredient.dto";
import { UpdateRecipeIngredientDto } from "../dto/update-recipe-ingedient.dto";
import { RecipeService } from "./recipe.service";
import { InventoryItemService } from "../../inventory-items/services/inventory-item.service";
import { UnitOfMeasureService } from "../../unit-of-measure/services/unit-of-measure.service";

export class RecipeIngredientService extends ServiceBase<RecipeIngredient>{
    constructor(
        @InjectRepository(RecipeIngredient)
        private readonly ingredientRepo: Repository<RecipeIngredient>,

        private readonly ingredientFactory: RecipeIngredientFactory,

        @Inject(forwardRef(() => RecipeService))
        private readonly recipeService: RecipeService,

        private readonly inventoryItemService: InventoryItemService,

        private readonly measureService: UnitOfMeasureService,
    ){ super(ingredientRepo); }

    /**
     * A recipe ingredient cannot reference both an inventory item and subRecipeIngredient, only one.
     * Should be checked at controller level
     */
    async create(createDto: CreateRecipeIngredientDto): Promise<RecipeIngredient | null> {
        const recipe = await this.recipeService.findOne(createDto.recipeId);
        if(!recipe){ 
            throw new Error("recipe not found"); 
        }

        let inventoryItem;
        if(createDto.inventoryItemId){
            inventoryItem = await this.inventoryItemService.findOne(createDto.inventoryItemId);
            if(!inventoryItem){
                throw new Error("inventory item not found");
            }
        }

        let subRecipeIngredient;
        if(createDto.subRecipeIngredientId){
            subRecipeIngredient = await this.recipeService.findOne(createDto.subRecipeIngredientId);
            if(!subRecipeIngredient){
                throw new Error("recipe as ingredient not found");
            }
        }

        const unit = await this.measureService.findOne(createDto.unitOfMeasureId);
        if(!unit){
            throw new Error("unit of measure not found");
        }

        const ingredient = this.ingredientFactory.createEntityInstance({
            Recipe: recipe,
            inventoryItem: inventoryItem,
            subRecipeIngredient: subRecipeIngredient,
            quantity: createDto.quantity,
            unit: unit,
        });

        return await this.ingredientRepo.save(ingredient);
    }
    
    /**
    * - Uses Repository.Save(), NOT UPDATE
    * - inventoryItem and subRecipe cannot be both assigned, only one, handled at controller level
    */
    async update(id: number, updateDto: UpdateRecipeIngredientDto): Promise< RecipeIngredient | null> {
        
        const toUpdate = await this.findOne(id);
        if(!toUpdate){ return null; }
        
        if(updateDto.recipeId){
            const recipe = await this.recipeService.findOne(updateDto.recipeId);
            if(!recipe){ 
                throw new Error("recipe not found"); 
            }
            toUpdate.recipe = recipe;
        }

        if(updateDto.inventoryItemId){
            const inventoryItem = await this.inventoryItemService.findOne(updateDto.inventoryItemId);
            if(!inventoryItem){
                throw new Error("inventory item not found");
            }
            toUpdate.inventoryItem = inventoryItem;
        }

        if(updateDto.subRecipeIngredientId){
            const subRecipeIngredient = await this.recipeService.findOne(updateDto.subRecipeIngredientId);
            if(!subRecipeIngredient){
                throw new Error("recipe as ingredient not found");
            }
            toUpdate.subRecipeIngredient = subRecipeIngredient;
        }

        if(updateDto.quantity){
            toUpdate.quantity = updateDto.quantity;
        }

        if(updateDto.unitOfMeasureId){
            const unit = await this.measureService.findOne(updateDto.unitOfMeasureId);
            if(!unit){
                throw new Error("unit of measure not found");
            }
            toUpdate.unit = unit;
        }

        return await this.ingredientRepo.save(toUpdate);
    }

    async findByRecipeName(name: string, relations?:string[]): Promise<RecipeIngredient[]>{
        const recipe = await this.recipeService.findOneByName(name, ["ingredients"]);
        if(!recipe){
            throw new Error("recipe not found");
        }
        return recipe.ingredients;
    }

    async findByInventoryItemName(name: string, relations?:string[]): Promise<RecipeIngredient[]>{
        const invItem = await this.inventoryItemService.findOneByName(name);
        if(!invItem){
            throw new Error('inventory item not found');
        }

        return await this.ingredientRepo.find({
            where: {
                inventoryItem: invItem
            },
            relations
        })
    }
}