import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { RecipeBuilder } from "../builders/recipe.builder";
import { CreateRecipeDto } from "../dto/create-recipe.dto";
import { UpdateRecipeDto } from "../dto/update-recipe-dto";
import { Recipe } from "../entities/recipe.entity";
import { RecipeIngredient } from "../entities/recipe-ingredient.entity";
import { InventoryItem } from "../../inventory-items/entities/inventory-item.entity";
import { UnitOfMeasure } from "../../unit-of-measure/entities/unit-of-measure.entity";
import { UnitOfMeasureService } from "../../unit-of-measure/services/unit-of-measure.service";

export class RecipeService extends ServiceBase<Recipe>{
    constructor(
        @InjectRepository(Recipe)
        private readonly recipeRepo: Repository<Recipe>,
        @InjectRepository(RecipeIngredient)
        private readonly ingredientRepo: Repository<RecipeIngredient>,
        private readonly recipeBuilder: RecipeBuilder,

        //private readonly menuItemService: MenuItemService,
    ){ super(recipeRepo); }

    async create(dto: CreateRecipeDto): Promise<Recipe | null> {
        const exists = await this.findOneByName(dto.name);
        if(exists) { return null; }

        const recipe = await this.recipeBuilder.buildCreateDto(dto);
        return await this.recipeRepo.save(recipe);
        /*
        // Step 1: Build base Recipe
        const recipe = this.recipeRepo.create({
            name: dto.name,
            isIngredient: dto.isIngredient,
            batchResultQuantity: dto.batchResultQuantity,
            servingSizeQuantity: dto.servingSizeQuantity,
            salesPrice: dto.salesPrice,
            cost: dto.cost,
            batchResultUnitOfMeasure: { id: dto.batchResultUnitOfMeasureId },
            servingSizeUnitOfMeasure: { id: dto.servingSizeUnitOfMeasureId },
            category: dto.categoryId ? { id: dto.categoryId } : null,
            subCategory: dto.subCategoryId ? { id: dto.subCategoryId } : null,
        });

        // Step 2: Save the Recipe first so it has an ID
        const savedRecipe = await this.recipeRepo.save(recipe);

        // Step 3: Handle ingredients (if any)
        if (dto.ingredients && dto.ingredients.length > 0) {
            const ingredients: RecipeIngredient[] = dto.ingredients.map((i) => {
                const ingredient = new RecipeIngredient();
                ingredient.recipe = savedRecipe;

                if (i.inventoryItemId) {
                    ingredient.inventoryItem = { id: i.inventoryItemId } as InventoryItem;
                } else if (i.subRecipeIngredientId) {
                    ingredient.subRecipeIngredient = { id: i.subRecipeIngredientId } as Recipe;
                }

                ingredient.quantity = i.quantity;
                ingredient.unit = { id: i.unitId } as UnitOfMeasure;

                return ingredient;
            });

            await this.ingredientRepo.save(ingredients);
            savedRecipe.ingredients = ingredients;
        }

        return savedRecipe;*/
    }
        
    /**
    * Uses Repository.Save(), not Repository.Update
    */
    async update(id: number, updateDto: UpdateRecipeDto): Promise<Recipe | null> {
        const toUpdate = await this.findOne(id);
        if(!toUpdate){ return null; }

        await this.recipeBuilder.buildUpdateDto(toUpdate, updateDto);
        return await this.recipeRepo.save(toUpdate);
    }

    async findOneByName(name: string, relations?: Array<keyof Recipe>): Promise<Recipe | null> {
        return this.recipeRepo.findOne({ where: {name: name }, relations});
    }
}