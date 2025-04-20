
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { RecipeIngredient } from "./recipe-ingredient.entity";
import { RecipeCategory } from "./recipe-category.entity";
import { RecipeSubCategory } from "./recipe-sub-category.entity";
import { MenuItem } from "../../menu-items/entities/menu-item.entity";
import { UnitOfMeasure } from "../../unit-of-measure/entities/unit-of-measure.entity";

@Entity()
export class Recipe{
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * - If the recipe references a MenuItem, the recipe's name will be the MenuItem's name. Like "Apple Crumb Pie", or "Triple Berry Scone"
     * - If the recipe isIngredient is marked true, the name is user entered. Like "Apple Mix", or "Ganache"
     */
    @Column()
    name: string

    /** 
     * The MenuItem that this recipe creates, some recipes are "prep" and are a sub-recipe to another Recipe
     * - If the MenuItem is deleted, the recipe is also deleted "onDelete: CASCADE" 
     */
    @OneToOne(() => MenuItem, {nullable: true, onDelete: 'SET NULL'})
    @JoinColumn()
    menuItem?: MenuItem | null;

    /*
    * A recipe with isIngredient set to true doesn't directly make a MenuItem,
    * but is an ingredient to another recipe.
    * - Recipe "Apple Mix", is not a direct MenuItem, but is an ingredient to Recipes such as "Classic Apple", "Apple Crumb"
    */
    @Column({ default: false })
    isIngredient: boolean;

    /**
     * Is an entity that joins either a Recipe or an InventoryItem representing an ingredient for the parent recipe
     * - Can be an InventoryItem: almonds sliced, (quantity), (unit of measure)
     * - Or a Recipe: Apple Mix, (quantity), (unit of measure), 
     *   where the recipe Apple Mix holds ingredients of other inventory items or other recipes
     */
    @OneToMany(() => RecipeIngredient, (ingredient) => ingredient.recipe, { nullable: true, cascade: true })
    ingredients?: RecipeIngredient[] | null; 

    @Column({ nullable: false })
    batchResultQuantity: number;

    @ManyToOne(() => UnitOfMeasure, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn()
    batchResultUnitOfMeasure?: UnitOfMeasure | null;

    @Column({ nullable: false })
    servingSizeQuantity: number;

    @ManyToOne(() => UnitOfMeasure, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn()
    servingSizeUnitOfMeasure?: UnitOfMeasure | null;

    @Column({ type: "decimal", precision: 10, scale: 2, nullable: false })
    salesPrice: number = 0;

    // sales price per serving calculated

    // cost per serving calculated

    @Column({ type: "decimal", precision: 10, scale: 2, nullable: false })
    cost: number = 0;

    @ManyToOne(() => RecipeCategory, (category) => category.recipes, { nullable: true, onDelete: 'SET NULL'})
    category?: RecipeCategory| null;

    /**
     * Can only be a sub-category from the referenced category's property RecipeCategory.subCategories[]
     */
    @ManyToOne(() => RecipeSubCategory, (subCategory) => subCategory.recipes, { nullable: true, onDelete: 'SET NULL' })
    subCategory?: RecipeSubCategory | null;
}