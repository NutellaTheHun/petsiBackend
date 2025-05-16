import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Recipe } from "./recipe.entity";
import { InventoryItem } from "../../inventory-items/entities/inventory-item.entity";
import { UnitOfMeasure } from "../../unit-of-measure/entities/unit-of-measure.entity";

/**
 * A ingredient within a {@link Recipe}, can either be an {@link InventoryItem} or another {@link Recipe}.
 */
@Entity()
export class RecipeIngredient{
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * The parent {@link Recipe} to the ingredient.
     * 
     */
    @ManyToOne(() => Recipe, (recipe) => recipe.ingredients, { onDelete: 'CASCADE', orphanedRowAction: 'delete' })
    recipe: Recipe;
    
    /**
     * The {@link InventoryItem} that is being used as the ingredient. 
     * 
     * - Example:  "flour" or "pecan halves"
     *
     * If a RecipeIngredient is referencing the inventoryItem property, the subRecipeIngredient property must be null/undefined.
     */
    @ManyToOne(() => InventoryItem, { nullable: true, onDelete: 'CASCADE' })
    inventoryItem?: InventoryItem | null;

    /**
     * A {@link Recipe} that is used as an ingredient in the parent recipe property.
     * 
     * Recipes such as "Apple Mix" or "Pie Dough"
     * 
     * A subRecipe is a Recipe with isIngredient marked true
     * 
     * If a RecipeIngredient is referencing the subRecipeIngredient property, the inventoryItem property must be null/undefined.
     */
    @ManyToOne(() => Recipe, { nullable: true, onDelete: 'CASCADE' })
    subRecipeIngredient?: Recipe | null;

    /**
     * the amount of the unit property for the referenced inventoryItem/subRecipeIngredient property.
     * 
     * Example: 3(quantity) cups of Flour
     */
    @Column({ type: "decimal", precision: 10, scale: 2, nullable: false })
    quantity: number;

    /**
     * The choice of measurement for the ingredient.
     * 
     * Example: 3 cups({@link UnitOfMeasure}) of Flour
     */
    @ManyToOne(() => UnitOfMeasure, { nullable: false, onDelete: 'CASCADE' }) 
    unit: UnitOfMeasure;
}