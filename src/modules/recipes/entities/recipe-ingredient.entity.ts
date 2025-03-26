import { BeforeInsert, BeforeUpdate, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Recipe } from "./recipe.entity";
import { InventoryItem } from "src/modules/inventory-items/entities/inventory-item.entity";
import { UnitOfMeasure } from "src/modules/unit-of-measure/entities/unit-of-measure.entity";

/**
 * A ingredient in a Recipe, can either be an InventoryItem or another Recipe that is marked isIngredient.
 */
@Entity()
export class RecipeIngredient{
    @PrimaryGeneratedColumn()
    id: number;

    // Link to Recipe that owns the ingredient
    @ManyToOne(() => Recipe, (recipe) => recipe.ingredients, { onDelete: 'CASCADE' })
    recipe: Recipe;
    
    /**
     * - The inventory item that this ingredient references. Like "flour" or "pecan halves"
     * - Can only be one inventory item per ingredient
     * - A RecipeIngredient can only have an inventoryItem OR subRecipe property set, not both
     */
    @ManyToOne(() => InventoryItem, { nullable: true, onDelete: 'CASCADE' })
    inventoryItem?: InventoryItem | null;

    /**
     * - A recipe that is a in ingredient for a recipe, such as "Apple Mix" or "Pie Dough"
     * - A subRecipe is a Recipe with isIngredient marked true
     * - A subRecipe doesn't represent an item on the menu (menuItem).
     */
    @ManyToOne(() => Recipe, { nullable: true, onDelete: 'CASCADE' })
    subRecipeIngredient?: Recipe | null;
    
    /*
    @BeforeInsert()
    @BeforeUpdate()
    validateIngredientType() {
        if (this.subRecipe && !this.subRecipe.isIngredient){
            throw new Error("subRecipe must be marked as an ingredient");
        }
        if (this.inventoryItem && this.subRecipe){
            throw new Error("Both inventoryItem and subRecipe cannot be set, one must be null.");
        }
        else if (!this.inventoryItem && !this.subRecipe) {
            throw new Error("Both inventoryItem and subRecipe cannot be null.");
        }
    }*/

    @Column({ type: "decimal", precision: 10, scale: 2, nullable: false })
    quantity: number;

    // Shouldn't really need to OnDelete cascade, but just to keep db clean in case?
    @ManyToOne(() => UnitOfMeasure, { nullable: false, onDelete: 'CASCADE' }) 
    unit: UnitOfMeasure;
}