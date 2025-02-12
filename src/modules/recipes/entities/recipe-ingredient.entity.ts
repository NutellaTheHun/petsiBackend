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
    
    @ManyToOne(() => InventoryItem, { nullable: true, onDelete: 'CASCADE' })
    inventoryItem?: InventoryItem;

    @ManyToOne(() => Recipe, { nullable: true, onDelete: 'CASCADE' })
    subRecipe?: Recipe;

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
    }

    @Column({ type: "decimal", precision: 10, scale: 2, nullable: false })
    quantity: number;

    // Shouldn't really need to OnDelete cascade, but just to keep db clean in case?
    @ManyToOne(() => UnitOfMeasure, { nullable: false, onDelete: 'CASCADE' }) 
    unit: UnitOfMeasure;
}