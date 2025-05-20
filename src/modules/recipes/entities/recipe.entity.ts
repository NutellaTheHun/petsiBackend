import { Check, Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { MenuItem } from "../../menu-items/entities/menu-item.entity";
import { UnitOfMeasure } from "../../unit-of-measure/entities/unit-of-measure.entity";
import { RecipeCategory } from "./recipe-category.entity";
import { RecipeIngredient } from "./recipe-ingredient.entity";
import { RecipeSubCategory } from "./recipe-sub-category.entity";
import { InventoryItem } from "../../inventory-items/entities/inventory-item.entity";

/**
 * The list of {@link RecipeIngredient} and details of yield, cost, and sales price.
 * 
 * A Recipe can map to a {@link MenuItem}, or be used in another Recipe. 
 */
@Entity()
export class Recipe {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, nullable: false })
    recipeName: string

    /** 
     * The {@link MenuItem} that this recipe produces.
     */
    @OneToOne(() => MenuItem, {nullable: true, onDelete: 'SET NULL'})
    @JoinColumn()
    producedMenuItem?: MenuItem | null;

    /*
    * A recipe with isIngredient set to true doesn't directly make a MenuItem, but is an ingredient to another recipe.

    * Recipe "Apple Mix", is not a direct MenuItem, but is an ingredient to Recipes such as "Classic Apple", "Apple Crumb"
    */
    @Column({ default: false })
    isIngredient: boolean;

    /**
     * A list of {@link RecipeIngredient} to make a Recipe. Can reference a {@link InventoryItem} or another recipe as the ingredient.
     * 
     * Can be an {@link InventoryItem}: almonds sliced, (quantity), (unit of measure)
     * 
     * Or a Recipe: Apple Mix, (quantity), (unit of measure),  
     * where the recipe Apple Mix holds ingredients of other inventory items or other recipes
     */
    @OneToMany(() => RecipeIngredient, (ingredient) => ingredient.parentRecipe, { cascade: true })
    ingredients: RecipeIngredient[];

    /**
     * The total unit amount of the batchResultUnitOfMeaure property produced by the recipe.
     * - Examples:
     * - 5(batchResultQuantity) pounds of berry mix
     * - 1(batchResultQuantity) unit of Blueberry Pie.
     */
    @Column({ nullable: true })
    @Check(`"batchResultQuantity" >= 1`)
    batchResultQuantity?: number | null;

    /**
     * The {@link UnitOfMeasure} that descibes the total yield the recipe produces.
     * 
     * - Examples:
     * - 5 pounds(batchResultUnitOfMeasure) of berry mix
     * - 1 unit(batchResultUnitOfMeasure) of Blueberry Pie.
     */
    @ManyToOne(() => UnitOfMeasure, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn()
    batchResultMeasurement?: UnitOfMeasure | null;

    /**
     * A unit amount of the servingSizeUnitOfMeasure property that is a subset of the batchResultQuantity property.
     * 
     * When a recipe produces an item(or items) that are sold in pieces of the yield.
     * 
     * Example: 
     * - A recipe for Banana Bread produces a loaf, and is then sold by the slice.
     * - 1 loaf could have a serving size of say 8(servingSizeQuantity) units.
     */
    @Column({ nullable: true })
    @Check(`"servingSizeQuantity" >= 1`)
    servingSizeQuantity?: number | null;

    /**
     * The {@link UnitOfMeasure} that descibes the total sellable portions of the recipes yield.
     * Example: 
     * - A recipe for Banana Bread produces a loaf, and is then sold by the slice.
     * - 1 loaf could have a serving size of say 8 units(servingSizeUnitOfMeasure).
     */
    @ManyToOne(() => UnitOfMeasure, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn()
    servingSizeMeasurement?: UnitOfMeasure | null;

    /**
     * The set price per servingSizeQuantity.
     */
    @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
    @Check(`"salesPrice" >= 0`)
    salesPrice?: string | null;

    // sales price per serving calculated

    // cost per serving calculated

    // cost calculated? getCostFunction()

    /**
     * The {@link RecipeCategory}, such as "Pie" or"Pastry"
     */
    @ManyToOne(() => RecipeCategory, (category) => category.recipes, { nullable: true, onDelete: 'SET NULL'})
    category?: RecipeCategory| null;

    /**
     * The {@link RecipeSubCategory} of {@link RecipeCategory}, such as "Sweet Pie" or "Savory Pie", of RecipeCategory Pie.
     */
    @ManyToOne(() => RecipeSubCategory, (subCategory) => subCategory.recipes, { nullable: true, onDelete: 'SET NULL' })
    subCategory?: RecipeSubCategory | null;
}