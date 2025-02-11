import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Recipe } from "./recipe.entity";
import { InventoryItem } from "src/modules/inventory-items/entities/inventory-item.entity";

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

    @ManyToOne(() => InventoryItem, { nullable: true, onDelete: 'CASCADE' })
    inventoryItem?: InventoryItem;

    @ManyToOne(() => Recipe, { nullable: true, onDelete: 'CASCADE' })
    subRecipe?: Recipe;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    quantity: number;

    @Column({ type: "varchar", length: 50 })
    unit: string; // e.g., "g", "ml", "pcs"
}